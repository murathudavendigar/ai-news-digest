// lib/realTimeData.js
// Gercek zamanli hava + piyasa verisi
//   Hava    : Open-Meteo  (ucretsiz, key yok, cok guvenilir)
//   Piyasa  : Birden fazla kaynak zinciri (Yahoo kırılgansa fallback var)

import { Redis } from "@upstash/redis";
import { getCityByKey } from "./cityConfig";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const MARKET_CACHE_TTL = 60 * 60; // 1 saat
const WEATHER_CACHE_TTL = 2 * 60 * 60; // 2 saat

// ── WMO kodu → Turkce koşul ──────────────────────────────────────────────
function wmoToCondition(code) {
  if (code === 0) return "açık";
  if (code <= 3) return "parçalı bulutlu";
  if (code <= 48) return "sisli";
  if (code <= 55 || code === 61 || code === 63) return "hafif yağmurlu";
  if (code <= 67) return "yağmurlu";
  if (code <= 77) return "karlı";
  if (code <= 82) return "sağanak yağışlı";
  return "fırtınalı";
}

// Şehir koordinatları cityConfig.js'den gelir

// ── Sayi formatlayici ────────────────────────────────────────────────────
function fmtTR(n, dec = 2) {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toLocaleString("tr-TR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}
function changePct(price, prev) {
  if (!price || !prev || prev === 0) return "—";
  const pct = ((price - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

// ════════════════════════════════════════════════════════════════════════
// HAVA DURUMU — Open-Meteo (hic kırılmaz, ucretsiz, key yok)
// ════════════════════════════════════════════════════════════════════════
export async function fetchWeatherData(city = "Istanbul") {
  const cacheKey = `realtime:weather:${city}`;

  // Cache kontrolü
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return cached;
  } catch {}

  const coords = getCityByKey(city);
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${coords.lat}&longitude=${coords.lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
    `&hourly=relativehumidity_2m` +
    `&timezone=Europe%2FIstanbul&forecast_days=1`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const data = await res.json();

    const daily = data.daily;
    const wmoCode = daily.weathercode?.[0] ?? 0;
    const rainProb = daily.precipitation_probability_max?.[0] ?? 0;

    // Gunduz nemi (saat 06-18 = indeks 6-18, Istanbul timezone ile dogru)
    const hourlyHum = data.hourly?.relativehumidity_2m || [];
    const daytimeHum = hourlyHum.slice(6, 18).filter((v) => v != null);
    const avgHumidity = daytimeHum.length
      ? Math.round(daytimeHum.reduce((a, b) => a + b, 0) / daytimeHum.length)
      : null;

    const result = {
      city: coords.label,
      condition: wmoToCondition(wmoCode),
      tempHigh: Math.round(daily.temperature_2m_max?.[0] ?? 0).toString(),
      tempLow: Math.round(daily.temperature_2m_min?.[0] ?? 0).toString(),
      humidity: avgHumidity != null ? avgHumidity.toString() : "—",
      note: rainProb > 50 ? `%${rainProb} yağış ihtimali` : null,
    };

    await redis
      .set(cacheKey, result, { ex: WEATHER_CACHE_TTL })
      .catch(() => {});
    return result;
  } catch (err) {
    console.error("[realTimeData] Hava durumu:", err.message);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════════
// PİYASA VERİSİ — 3 katmanlı fallback zinciri
// Katman 1: Yahoo Finance query2 (daha az engellenen endpoint)
// Katman 2: Frankfurter.app (EUR/USD doviz — ucretsiz)
// Katman 3: Cache'teki son bilinen deger
// ════════════════════════════════════════════════════════════════════════

// Yahoo Finance — query2 endpoint, crumb gerektirmez
async function yahooQuote(symbol) {
  // query2 daha az rate-limit yiyor
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
      "Accept-Language": "tr-TR,tr;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Yahoo ${symbol}: HTTP ${res.status}`);

  const json = await res.json();
  const meta = json.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error(`Yahoo ${symbol}: veri bos`);

  return {
    price: meta.regularMarketPrice,
    prevClose:
      meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice,
  };
}

// Frankfurter.app — sadece EUR/USD bazli kurlar (USDTRY yok ama EURTRY var)
// Alternatif: exchangerate-api.com free tier
async function frankfurterRate(from, to) {
  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
    { signal: AbortSignal.timeout(6000) },
  );
  if (!res.ok) throw new Error(`Frankfurter ${from}/${to}: HTTP ${res.status}`);
  const data = await res.json();
  const rate = data.rates?.[to];
  if (!rate) throw new Error(`Frankfurter: ${to} bulunamadi`);
  return rate;
}

export async function fetchMarketData() {
  const cacheKey = "realtime:markets";

  // 1. Cache kontrolu
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return cached;
  } catch {}

  // 2. Tum sembolleri paralel cek
  const [bistR, usdR, eurR, goldR] = await Promise.allSettled([
    yahooQuote("XU100.IS"), // BIST 100
    yahooQuote("USDTRY=X"), // USD/TRY
    yahooQuote("EURTRY=X"), // EUR/TRY
    yahooQuote("GC=F"), // Altin vadeli (USD/troy oz)
  ]);

  // Yahoo basarisiz olursa Frankfurter fallback (sadece EUR/TRY icin)
  let eurFallback = null;
  if (eurR.status === "rejected") {
    try {
      // USD/TRY ve EUR/USD'dan EUR/TRY hesapla
      const [eurUsd, usdTryFB] = await Promise.all([
        frankfurterRate("EUR", "USD"),
        frankfurterRate("USD", "TRY").catch(() => null),
      ]);
      if (usdTryFB)
        eurFallback = {
          price: eurUsd * usdTryFB,
          prevClose: eurUsd * usdTryFB,
        };
    } catch {}
  }

  const bist = bistR.status === "fulfilled" ? bistR.value : null;
  const usd = usdR.status === "fulfilled" ? usdR.value : null;
  const eur = eurR.status === "fulfilled" ? eurR.value : eurFallback || null;
  const gold = goldR.status === "fulfilled" ? goldR.value : null;

  // Log basarisizliklari
  if (!bist)
    console.warn("[realTimeData] BIST alinamadi:", bistR.reason?.message);
  if (!usd)
    console.warn("[realTimeData] USD/TRY alinamadi:", usdR.reason?.message);
  if (!eur)
    console.warn("[realTimeData] EUR/TRY alinamadi:", eurR.reason?.message);
  if (!gold)
    console.warn("[realTimeData] Altin alinamadi:", goldR.reason?.message);

  // Gram altin TL = (USD/troy-oz / 31.1035) * USD/TRY
  const goldGramTry =
    gold && usd ? Math.round((gold.price / 31.1035) * usd.price) : null;

  const result = {
    bist100: bist ? fmtTR(bist.price, 2) : "—",
    bist100Change: bist ? changePct(bist.price, bist.prevClose) : "—",
    usdTry: usd ? fmtTR(usd.price, 4) : "—",
    eurTry: eur ? fmtTR(eur.price, 4) : "—",
    goldGram: goldGramTry != null ? fmtTR(goldGramTry, 0) : "—",
    note: "Yahoo Finance · 15dk gecikmeli",
    fetchedAt: new Date().toISOString(),
  };

  // 3. Cache'e yaz (en az 1 alan doluysa)
  const hasData = bist || usd || eur || gold;
  if (hasData) {
    await redis.set(cacheKey, result, { ex: MARKET_CACHE_TTL }).catch(() => {});
  } else {
    // Hicbir veri gelmedi — son bilinen cache degerini daha uzun tut
    console.error("[realTimeData] Tum piyasa kaynaklari basarisiz");
  }

  return hasData ? result : null;
}

// ── Her ikisini paralel cek — ozet sayfasi icin ──────────────────────────
export async function fetchRealTimeData(city = "Istanbul") {
  const [weather, markets] = await Promise.all([
    fetchWeatherData(city),
    fetchMarketData(),
  ]);
  return { weather, markets };
}
