import { supabaseAdmin } from "./supabase";
import { getNewsFeed } from "./newsSource";
import { fetchMarketData } from "./realTimeData";
import { generateJSON, GEMINI_MODELS } from "./gemini";

export async function generateDailyDigest() {
  const today = new Date().toISOString().slice(0, 10);

  // 1. Check if today's digest already exists in Supabase
  const { data: existing, error: checkError } = await supabaseAdmin
    .from("daily_digests")
    .select("id")
    .eq("date", today)
    .maybeSingle();

  if (checkError) {
    console.error("[dailyDigest] Supabase check error:", checkError);
    return { error: "supabase_error" };
  }
  if (existing) {
    console.log(`[dailyDigest] Digest for ${today} already exists, skipping.`);
    return { success: true, skipped: true };
  }

  // 2. Fetch today's top news (reuse existing news fetching logic)
  const feedData = await getNewsFeed({ page: 1, pageSize: 30 });
  const articles = (feedData.results || []).slice(0, 25);
  if (!articles.length) return { error: "no_articles" };

  // Prepare article text for Gemini
  const articleList = articles
    .map(
      (a, i) =>
        `[${i + 1}] ${a.source_name || "?"} | ${a.title} | ${a.description?.slice(0, 120)} | URL: ${a.link}`
    )
    .join("\n");

  // Optional: Fetch market data
  let marketData = null;
  try {
    marketData = await fetchMarketData();
  } catch (err) {
    console.warn("[dailyDigest] Market data fetch failed:", err);
  }

  // 3. Call Gemini API to generate the digest
  const prompt = `Sen Türkiye'nin en iyi yapay zeka haber editörüsün. Bugün ${today}.
Lütfen aşağıdaki haberleri analiz ederek günün en önemli 5 haberini (top_stories) seç ve özetle. Haberlerin orijinal kaynağını (source ve url) mutlaka koru.
Piyasa verileri: ${JSON.stringify(marketData)}

HABERLER:
${articleList}

ZORUNLU FORMAT: Yanıt YALNIZCA aşağıdaki JSON formatında olmalıdır. Başka hiçbir açıklama yazma.
{
  "top_stories": [
    {
      "headline": "...",
      "summary": "...",
      "url": "...",
      "category": "...",
      "source": "..."
    }
  ],
  "market_data": { ... piyasa verilerinin kısa özeti veya null ... }
}`;

  const generatedData = await generateJSON(prompt, {
    model: GEMINI_MODELS.PRIMARY_ANALYSIS,
    temperature: 0.3,
    maxTokens: 4000,
    label: "Daily Digest Generation",
  });

  if (!generatedData || !generatedData.top_stories) {
    console.error("[dailyDigest] Gemini JSON output invalid:", generatedData);
    return { error: "generation_failed" };
  }

  // 4. Insert into Supabase
  const insertData = {
    date: today,
    top_stories: generatedData.top_stories,
    market_data: generatedData.market_data || marketData,
    model_used: GEMINI_MODELS.PRIMARY_ANALYSIS,
  };

  const { error: insertError } = await supabaseAdmin
    .from("daily_digests")
    .insert([insertData]);

  if (insertError) {
    console.error("[dailyDigest] Supabase insert error:", insertError);
    return { error: "supabase_insert_error", details: insertError };
  }

  console.log(`[dailyDigest] Successfully generated and saved digest for ${today}`);
  return { success: true, date: today, data: insertData };
}
