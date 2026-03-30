import { supabaseAdmin } from "./supabase";
import {
  getTodaysColumnistSlug,
  getTodayPublishTime,
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
 * 4. Haberleri çek → Gemini'ye gönder
 * 5. Kalite kapısı (meta-commentary, AI ifade kontrolü)
 * 6. DB'ye yaz → push notification gönder
 */
export async function generateColumn() {
  const slug = getTodaysColumnistSlug();
  if (!slug) return { error: "No columnist scheduled for today" };

  // 1. Fetch columnist from DB
  const { data: columnist, error: colError } = await supabaseAdmin
    .from("columnists")
    .select("id, name, slug, expertise, system_prompt")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (colError || !columnist) {
    console.error(`[generateColumn] Columnist ${slug} not found:`, colError);
    return { error: "Columnist not found" };
  }

  // 2. Check if today's column already exists
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

  // 3. Fetch today's news
  try {
    const feedData = await getNewsFeed({ page: 1, pageSize: 5 });
    const topStory = feedData.results?.[0];
    if (!topStory) {
      return { error: "No news found for inspiration" };
    }

    // 4. Gemini prompt — exact spec
    const userPrompt = `Today's news context for your column:
Headline: ${topStory.title}
Summary: ${topStory.description || ""}
Source: ${topStory.source_name || topStory.source || ""}

Write a column in Turkish, 500-700 words.
Rules:
1. Start immediately — a scene, a moment, a provocative line. No preamble.
2. First sentence must be impossible to stop reading.
3. Short paragraphs (2-4 sentences max).
4. Write as your character, not as an AI assistant.
5. One mandatory moment of genuine surprise or emotional resonance.
6. Apply your signature style naturally — never announce it.
7. NEVER mention you are an AI.
8. NEVER use "Bu yazıda", "Bu köşede", "Bugün sizlerle", or similar openers.

Return ONLY a raw JSON object, no markdown fences, no explanation:
{
  "title": "Compelling column title — not clickbait, not generic",
  "subtitle": "One-line teaser or null",
  "content": "Full column in markdown. ## section breaks only if truly needed.",
  "topic_summary": "One sentence: what news inspired this piece",
  "read_time_minutes": 4
}`;

    // 5. Generate with fallback chain + quality gate
    let generatedData = null;
    let modelUsed = GEMINI_MODELS.PRIMARY_ANALYSIS;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        generatedData = await generateJSON(userPrompt, {
          model: GEMINI_MODELS.PRIMARY_ANALYSIS,
          temperature: 0.6 + attempt * 0.1,
          maxTokens: 5000,
          label: `Column — ${columnist.name} (attempt ${attempt})`,
          systemPrompt: columnist.system_prompt,
        });

        // Quality gate
        const content = (generatedData?.content || "").toLowerCase();
        const isBadStart =
          content.startsWith("bu yazıda") ||
          content.startsWith("bugün") ||
          content.startsWith("bu köşede");

        if (isBadStart && attempt < 2) {
          console.warn(
            `[generateColumn] Attempt ${attempt} failed quality gate — retrying with stricter prompt.`,
          );
          continue;
        }

        if (generatedData?.title && generatedData?.content) break;
      } catch (err) {
        console.warn(
          `[generateColumn] Attempt ${attempt} error:`,
          err.message,
        );
        if (attempt === 2) {
          return {
            error: "Generation failed",
            details: err.message,
          };
        }
      }
    }

    if (!generatedData?.title || !generatedData?.content) {
      return { error: "Generation failed quality checks" };
    }

    // 6. Generate slug
    const columnSlug = toColumnSlug(generatedData.title, publishTime);

    // 7. Insert into DB
    const insertData = {
      columnist_id: columnist.id,
      slug: columnSlug,
      title: generatedData.title,
      subtitle: generatedData.subtitle || null,
      content: generatedData.content,
      topic_summary: generatedData.topic_summary || "",
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

    // --- Quote and Poll enrichment (blocking enough to finish before Vercel kills it) ---
    const insertedId = inserted.id;
    await Promise.allSettled([
      // Quote extraction
      generateJSON(
        `Bu köşe yazısından en çarpıcı, en paylaşılabilir 1 cümleyi seç.
         Bağlamdan koparılınca da anlam taşımalı. Slogan değil, insan gibi yazılmış olmalı.
         
         Yazı:
         ${generatedData.content.slice(0, 3000)}
         
         Yanıt YALNIZCA JSON:
         {"quote": "cümle", "context": "tek cümlelik bağlam"}`,
        { model: GEMINI_MODELS.HIGH_SPEED, temperature: 0.2, label: 'quote' }
      ).then(async (result) => {
        await supabaseAdmin.from('columns').update({
          featured_quote: result.quote,
          featured_quote_context: result.context,
        }).eq('id', insertedId);
        console.log('[generateColumn] ✓ Quote saved');
      }).catch(err => devWarn('[generateColumn] Quote failed:', err.message)),

      // Poll generation
      generateJSON(
        `Bu köşe yazısının en tartışmalı noktasını baz alarak okuyucu anketi yaz.
         Soru tarafsız, 3 seçenek farklı bakış açıları, her seçenek max 8 kelime.
         Siyasi veya dinî yargı içermemeli.
         
         Yazı özeti: ${generatedData.topic_summary}
         İçerik: ${generatedData.content.slice(0, 2000)}
         
         Yanıt YALNIZCA JSON:
         {"question": "Soru?", "options": ["A", "B", "C"]}`,
        { model: GEMINI_MODELS.HIGH_SPEED, temperature: 0.3, label: 'poll' }
      ).then(async (result) => {
        await supabaseAdmin.from('column_polls').insert({
          column_id: insertedId,
          question: result.question,
          options: result.options,
        });
        console.log('[generateColumn] ✓ Poll saved');
      }).catch(err => devWarn('[generateColumn] Poll failed:', err.message)),
    ]).then(results => {
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length) devWarn(`[generateColumn] ${failed.length} enrichment(s) failed`);
    });

    // 8. Push notification
    try {
      await sendPushNotification({
        title: `${columnist.name} yazdı ✍️`,
        body: generatedData.title,
        url: `/columns/${columnist.slug}/${columnSlug}`,
      });
      console.log(
        `[generateColumn] Push notification sent for ${columnist.name}`,
      );
    } catch (pushErr) {
      // Push failure is non-fatal
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
    };
  } catch (err) {
    console.error("[generateColumn] Unexpected error:", err);
    return { error: "Generation failed", details: err.message };
  }
}
