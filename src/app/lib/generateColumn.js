import { supabaseAdmin } from "./supabase";
import {
  getTodaysColumnistSlug,
  getTodayPublishTime,
  pickStoryForColumnist,
  toColumnSlug,
} from "./columnistConfig";
import { getNewsFeed } from "./newsSource";
import { generateJSON, GEMINI_MODELS } from "./gemini";
import { sendPushNotification } from "./push";
import { devWarn } from "./devLog";

/**
 * generateColumn — Günün köşe yazarı için AI kolonu üretir.
 *
 * 1. Bugünün yazarını belirle
 * 2. Supabase'den yazar bilgilerini çek
 * 3. Bugün zaten yazılmış mı kontrol et
 * 4. Haberleri çek → uzmanlığa en yakın haberi seç
 * 5. Gemini (systemInstruction = persona) → kalite kapısı
 * 6. DB'ye yaz → quote/poll → push
 */
export async function generateColumn() {
  const slug = getTodaysColumnistSlug();
  if (!slug) return { error: "No columnist scheduled for today" };

  const { data: columnist, error: colError } = await supabaseAdmin
    .from("columnists")
    .select("id, name, slug, expertise, system_prompt, signature_style")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (colError || !columnist) {
    console.error(`[generateColumn] Columnist ${slug} not found:`, colError);
    return { error: "Columnist not found" };
  }

  if (!columnist.system_prompt?.trim()) {
    return { error: "Columnist missing system_prompt" };
  }

  const publishTime = getTodayPublishTime();
  const todayStart = new Date(
    Date.UTC(
      publishTime.getUTCFullYear(),
      publishTime.getUTCMonth(),
      publishTime.getUTCDate(),
      0,
      0,
      0,
    ),
  ).toISOString();

  const { data: existing } = await supabaseAdmin
    .from("columns")
    .select("id")
    .eq("columnist_id", columnist.id)
    .gte("published_at", todayStart)
    .maybeSingle();

  if (existing) {
    console.log(
      `[generateColumn] Column already exists for ${columnist.name} today.`,
    );
    return { skipped: true, reason: "already_exists" };
  }

  try {
    // Daha geniş feed → uzmanlık eşlemesi için aday havuzu
    const feedData = await getNewsFeed({ page: 1, pageSize: 30 });
    const candidates = feedData.results || [];
    const topStory = pickStoryForColumnist(
      candidates,
      columnist.slug,
      columnist.expertise,
    );
    if (!topStory) {
      return { error: "No news found for inspiration" };
    }

    console.log(
      `[generateColumn] Topic for ${columnist.name}: "${topStory.title?.slice(0, 80)}" (${columnist.expertise})`,
    );

    const signatureHint = columnist.signature_style
      ? `\nSignature craft note (apply naturally, never announce): ${columnist.signature_style}`
      : "";

    const userPrompt = `You are writing today's column as ${columnist.name}.
Expertise focus: ${columnist.expertise || "general commentary"}
${signatureHint}

NEWS INSPIRATION (use as the factual anchor — do not invent other "today's events"):
Headline: ${topStory.title}
Summary: ${topStory.description || "(short summary only — do not invent missing details)"}
Source: ${topStory.source_name || topStory.source || ""}
Categories: ${Array.isArray(topStory.category) ? topStory.category.join(", ") : topStory.category || ""}

Write a column in Turkish, roughly 500–700 words.

HARD RULES:
1. Stay in character. Voice comes from your system identity.
2. The column must clearly connect to THIS news item — your angle must fit your expertise. If the news is outside your lane, still write from your lane (e.g. sports writer finds the human/competitive angle; economist finds the money angle) without inventing unrelated breaking news.
3. Start immediately — scene, moment, or sharp line. No preamble.
4. Forbidden openers (exact phrases): "Bu yazıda", "Bu köşede", "Bugün sizlerle", "Merhaba", "Değerli okurlar".
5. Short paragraphs (2–4 sentences).
6. Do NOT invent named sources, quotes, statistics, or private anecdotes about real public figures that are not in the inspiration text. Composite/anonymous scenes ("metrodaki biri") are OK when they are clearly literary framing, not reported fact.
7. Do NOT claim you personally witnessed today's event unless the inspiration text supports it.
8. NEVER mention you are an AI or a language model.
9. Entire column in Turkish.

Return ONLY a raw JSON object:
{
  "title": "Compelling Turkish title — not clickbait",
  "subtitle": "One-line teaser or null",
  "content": "Full column in markdown. Use ## only if a real section break helps.",
  "topic_summary": "One Turkish sentence: which news inspired this and your angle",
  "read_time_minutes": 4
}`;

    let generatedData = null;
    let modelUsed = GEMINI_MODELS.PRIMARY_ANALYSIS;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const attemptPrompt =
          attempt === 1
            ? userPrompt
            : `${userPrompt}

RETRY: Previous draft failed quality checks. Open with a concrete scene or sharp claim — not a meta opener. Stay on the news above.`;

        generatedData = await generateJSON(attemptPrompt, {
          model: GEMINI_MODELS.PRIMARY_ANALYSIS,
          temperature: 0.55 + attempt * 0.1,
          maxTokens: 5000,
          label: `Column — ${columnist.name} (attempt ${attempt})`,
          systemPrompt: columnist.system_prompt,
        });

        const gate = passesColumnQualityGate(generatedData);
        if (!gate.ok && attempt < 2) {
          console.warn(
            `[generateColumn] Attempt ${attempt} failed gate (${gate.reason}) — retrying.`,
          );
          continue;
        }

        if (generatedData?.title && generatedData?.content) break;
      } catch (err) {
        console.warn(`[generateColumn] Attempt ${attempt} error:`, err.message);
        if (attempt === 2) {
          return { error: "Generation failed", details: err.message };
        }
      }
    }

    if (!generatedData?.title || !generatedData?.content) {
      return { error: "Generation failed quality checks" };
    }

    const columnSlug = toColumnSlug(generatedData.title, publishTime);

    const insertData = {
      columnist_id: columnist.id,
      slug: columnSlug,
      title: generatedData.title,
      subtitle: generatedData.subtitle || null,
      content: generatedData.content,
      topic_summary:
        generatedData.topic_summary ||
        `İlham: ${topStory.title}`.slice(0, 280),
      read_time_minutes: generatedData.read_time_minutes || 4,
      published_at: publishTime.toISOString(),
      model_used: modelUsed,
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("columns")
      .insert([insertData])
      .select("id")
      .single();

    if (insertError) {
      console.error("[generateColumn] DB insert error:", insertError.message);
      return { error: "DB Insert Failed", details: insertError.message };
    }

    const insertedId = inserted.id;
    await Promise.allSettled([
      generateJSON(
        `Bu köşe yazısından en çarpıcı, en paylaşılabilir 1 cümleyi seç.
Bağlamdan koparılınca da anlam taşımalı. Slogan değil, insan gibi yazılmış olmalı.

Yazı:
${generatedData.content.slice(0, 3000)}

Yanıt YALNIZCA JSON:
{"quote": "cümle", "context": "tek cümlelik bağlam"}`,
        {
          model: GEMINI_MODELS.HIGH_SPEED,
          temperature: 0.2,
          label: "quote",
        },
      )
        .then(async (result) => {
          await supabaseAdmin
            .from("columns")
            .update({
              featured_quote: result.quote,
              featured_quote_context: result.context,
            })
            .eq("id", insertedId);
          console.log("[generateColumn] ✓ Quote saved");
        })
        .catch((err) =>
          devWarn("[generateColumn] Quote failed:", err.message),
        ),

      generateJSON(
        `Bu köşe yazısının en tartışmalı noktasını baz alarak okuyucu anketi yaz.
Soru tarafsız, 3 seçenek farklı bakış açıları, her seçenek max 8 kelime.
Siyasi veya dinî yargı içermemeli.

Yazı özeti: ${generatedData.topic_summary}
İçerik: ${generatedData.content.slice(0, 2000)}

Yanıt YALNIZCA JSON:
{"question": "Soru?", "options": ["A", "B", "C"]}`,
        {
          model: GEMINI_MODELS.HIGH_SPEED,
          temperature: 0.3,
          label: "poll",
        },
      )
        .then(async (result) => {
          await supabaseAdmin.from("column_polls").insert({
            column_id: insertedId,
            question: result.question,
            options: result.options,
          });
          console.log("[generateColumn] ✓ Poll saved");
        })
        .catch((err) =>
          devWarn("[generateColumn] Poll failed:", err.message),
        ),
    ]).then((results) => {
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length)
        devWarn(`[generateColumn] ${failed.length} enrichment(s) failed`);
    });

    try {
      await sendPushNotification({
        title: `${columnist.name} · yeni köşe`,
        body: generatedData.title,
        url: `/columns/${columnist.slug}/${columnSlug}`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: `column-${columnist.slug}`,
      });
      console.log(
        `[generateColumn] Push notification sent for ${columnist.name}`,
      );
    } catch (pushErr) {
      console.error("[generateColumn] Push error:", pushErr.message);
    }

    console.log(
      `[generateColumn] ✓ ${columnist.name}: "${generatedData.title}"`,
    );
    return {
      success: true,
      columnist: columnist.name,
      title: generatedData.title,
      slug: columnSlug,
      id: inserted.id,
      inspiredBy: topStory.title,
    };
  } catch (err) {
    console.error("[generateColumn] Unexpected error:", err);
    return { error: "Generation failed", details: err.message };
  }
}

/** Zayıf meta girişleri / AI ifşası / aşırı kısa içerik */
function passesColumnQualityGate(data) {
  const content = (data?.content || "").trim();
  if (!content || content.length < 400) {
    return { ok: false, reason: "too_short" };
  }
  const lower = content.toLowerCase();
  const badOpeners = [
    "bu yazıda",
    "bu köşede",
    "bugün sizlerle",
    "merhaba",
    "değerli okurlar",
    "as an ai",
    "yapay zeka olarak",
    "bir dil modeli",
  ];
  for (const phrase of badOpeners) {
    if (lower.startsWith(phrase)) {
      return { ok: false, reason: `bad_opener:${phrase}` };
    }
  }
  if (
    /yapay zeka olarak|dil modeli|as an ai|i'm an ai|ben bir yapay/i.test(
      content,
    )
  ) {
    return { ok: false, reason: "ai_disclosure" };
  }
  return { ok: true };
}
