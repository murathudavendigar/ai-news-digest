/**
 * Kirli scrape/RSS gövdesini ücretsiz FAST model ile habere uygun hale getirir.
 * Yeni bilgi UYDURMAZ — yalnızca gürültüyü ayıklar.
 */

import { withAiContract } from "./aiContract";
import { needsAiBodyCleanup, scrubPromoNoise } from "./cleanArticleText";
import { generateCompletion, GROQ_MODELS, tryParseJSON } from "./groq";

const SYSTEM = `Sen bir haber editörü asistanısın. Görevin: ham siteden çekilmiş metinden
SADECE asıl haber gövdesini çıkarmak.

KALDIR:
- Breadcrumb / navigasyon ("Haberler Dizi & Film …")
- Reklam etiketleri ve reklam artıkları
- "İlgili haber", oyun, quiz, "bunlar da ilginizi çekebilir" başlıkları
- Yazar biyografisi / editör kutusu / "çalışıyorum" bitişleri
- Sosyal paylaşım / abone / Google takip CTA'ları

KORU:
- Haberin olay anlatımı, alıntılar, isimler, tarihler
- Orijinal anlam — yeni cümle, rakam veya iddia EKLEME

Çıktı: yalnızca JSON.`;

/**
 * @param {string} bodyText
 * @param {{ title?: string }} [opts]
 * @returns {Promise<{ bodyText: string, cleaned: boolean, method: string }>}
 */
export async function refineArticleBody(bodyText, { title } = {}) {
  const heuristic = scrubPromoNoise(bodyText, { title });
  if (!heuristic || heuristic.length < 120) {
    return { bodyText: heuristic || "", cleaned: false, method: "heuristic" };
  }

  if (!needsAiBodyCleanup(bodyText) && !needsAiBodyCleanup(heuristic)) {
    return { bodyText: heuristic, cleaned: false, method: "heuristic" };
  }

  const userPrompt = withAiContract(`Başlık: ${title || "(yok)"}

Ham metin:
"""
${heuristic.slice(0, 5500)}
"""

JSON:
{
  "paragraphs": ["haber paragrafı 1", "haber paragrafı 2"]
}

Kurallar:
- paragraphs yalnızca haber gövdesi (2–8 paragraf)
- Reklam, bio, ilgili haber, breadcrumb YOK
- Bilgi uydurma YOK; emin değilsen kısa tut`);

  try {
    const result = await generateCompletion(userPrompt, {
      model: GROQ_MODELS.FAST,
      temperature: 0.1,
      maxTokens: 1800,
      systemPrompt: SYSTEM,
    });

    const parsed = tryParseJSON(result.text);
    const paras = Array.isArray(parsed?.paragraphs)
      ? parsed.paragraphs
          .map((p) => String(p || "").replace(/\s+/g, " ").trim())
          .filter((p) => p.length > 40)
      : [];

    if (paras.length >= 1) {
      const joined = scrubPromoNoise(paras.join("\n\n"), { title });
      if (joined.length >= 120) {
        return {
          bodyText: joined,
          cleaned: true,
          method: `ai:${result.provider || "fast"}`,
        };
      }
    }
  } catch (err) {
    console.warn("[refineArticleBody]", err.message);
  }

  return { bodyText: heuristic, cleaned: false, method: "heuristic-fallback" };
}
