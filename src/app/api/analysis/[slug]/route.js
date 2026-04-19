import { redis } from "@/app/lib/redis";
import { generateWithGrounding, GEMINI_MODELS } from "@/app/lib/gemini";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");

  if (!title) {
    return Response.json({ error: "title required" }, { status: 400 });
  }

  const cacheKey = `analysis:${slug}`;

  try {
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached;
      return Response.json({ ...data, cached: true });
    }

    // Generate with Gemini + Google Search grounding
    const prompt = `
"${title}" haberini analiz et.

Türkçe olarak şu yapıda kapsamlı bir arka plan analizi yaz:

1. KONU NEDİR?
Bu haberin konusunu, bağlamını bilmeyen biri için 2-3 cümleyle açıkla.

2. NEDEN ÖNEMLİ?
Bu haberin önemi ve potansiyel etkileri nelerdir? 2-3 madde.

3. NASIL GELDİK BURAYA?
Bu gelişmeye yol açan son 3-5 önemli olay veya gelişme. Kronolojik sırayla.

4. KİLİT İSİMLER VE KURUMLAR
Bu haberle ilgili bilmemiz gereken kişi, kurum ve organizasyonlar. Her biri için 1 cümle açıklama.

5. BUNDAN SONRA NE OLABİLİR?
Olası senaryolar ve beklentiler. "Olabilir", "bekleniyor" gibi ihtimalli dil kullan.

Yanıt YALNIZCA JSON:
{
  "whatIsIt": "2-3 cümle bağlam",
  "whyMatters": ["madde 1", "madde 2", "madde 3"],
  "timeline": [
    { "date": "Mart 2026", "event": "Ne oldu" }
  ],
  "keyPlayers": [
    { "name": "İsim", "role": "Rolü" }
  ],
  "whatNext": ["senaryo 1", "senaryo 2"],
  "generatedAt": "${new Date().toISOString()}"
}
`;

    const raw = await generateWithGrounding(prompt, {
      model: GEMINI_MODELS.PRIMARY_ANALYSIS,
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Parse JSON from grounding response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const analysis = JSON.parse(jsonMatch[0]);

    // Cache for 6 hours
    await redis.setex(cacheKey, 21600, JSON.stringify(analysis));

    return Response.json({ ...analysis, cached: false });
  } catch (err) {
    console.error("[analysis]", slug, err.message);
    return Response.json(
      { error: "Analiz üretilemedi", details: err.message },
      { status: 500 }
    );
  }
}
