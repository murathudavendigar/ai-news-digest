# HaberAI — Sürüm Yol Haritası

> Son güncelleme: 3 Mart 2026  
> Aktif sürüm: **v1.6.2**  
> Versiyon kuralı: `MAJOR.MINOR.PATCH`  
> — MAJOR: tam yeniden tasarım veya kırıcı değişiklik  
> — MINOR: yeni özellik veya önemli iyileştirme  
> — PATCH: hata düzeltme, prompt tweaki, küçük UX iyileştirmesi

---

## ✅ Yayınlanan Sürümler

---

### v1.0.0 — İlk Kararlı Yayın
**Durum:** Tamamlandı

Temel haberveri akışı ve PWA altyapısı.

- Next.js App Router + Vercel Hobby deployment
- NewsData.io + RSS kaynaklarından haber çekme
- AI destekli haber özeti (Groq Llama)
- Güvenilirlik analizi ve bağlamsal analiz (`analyzeArticle`)
- Kategori sayfaları (`/category/[slug]`)
- Bookmark sistemi (`useBookmarks` + `/saved`)
- PWA manifest, service worker, offline sayfası
- Dark/light mod (`next-themes`)
- Admin paneli temel görünüm
- `siteConfig.js` merkezi yapılandırma

---

### v1.1.0 — Navigasyon Yeniden Tasarımı
**Durum:** Tamamlandı

11 kategorinin navbar'ı bozması sorunu çözüldü.

- Desktop'ta kompakt 3-öğeli nav: `Anasayfa | Kategoriler ▾ | Günün Özeti`
- `Kategoriler` dropdown: `useRef` + dışarı tıklayınca kapanma, 2 sütunlu grid
- Mobil alt tab bar korundu, kategori sheet güncellendi
- `--header-height` CSS değişkeni 88px sabitlendi

---

### v1.2.0 — İçerik Kalitesi
**Durum:** Tamamlandı

Ham veri kalitesi ve haber akışı düzeni iyileştirmeleri.

- `rssParser.js`'te `decodeHtmlEntities()` — tüm `&#x27;`, `&amp;` vb. HTML entity'leri çözüldü
- `newsSource.js`'te `interleaveBySource()` — aynı kaynak art arda gelmesin, round-robin karıştırma
- Feed ilk yüklemede kaynak tekilleştirme düzeltildi

---

### v1.3.0 — Push Bildirimleri
**Durum:** Tamamlandı

Web Push altyapısı ve cron entegrasyonu.

- VAPID anahtar çifti + `web-push` paketi
- `/api/push/subscribe` (POST abone ol / DELETE aboneliği sil)
- `public/sw.js` push event + notificationclick handler
- `PushNotificationToggle.jsx` (compact toggle + tam boy buton)
- `PushPrompt.jsx` — 4 saniye sonra beliren izin banner'ı, localStorage'a reddetme kaydı
- `/api/cron/push-notify` — günlük 17:00 UTC, günün özeti + 3 haber başlığı
- `vercel.json` cron: `0 17 * * *`

---

### v1.4.0 — Admin Paneli Genişletme
**Durum:** Tamamlandı

Operasyonel kontrol araçları ve analitik.

- Vercel Analytics entegrasyonu (`/api/admin/analytics`)
- Admin dashboard'a 📊 Analytics section: ziyaretçi, sayfa görüntüleme, cihaz dağılımı
- Manuel push bildirim gönderme bölümü (title/body/url + 120 karakter sayacı)
- Animasyonlu sayı sayaçları (`useCountUp` hook, 700ms ease-out)
- Duplicate `loadAnalytics` identifier hatası düzeltildi

---

### v1.5.0 — Mobil Deneyim & Cron Sabitleme
**Durum:** Tamamlandı

Mobil UX iyileştirmeleri ve altyapı düzeltmeleri.

- Versiyon `0.1.0 → 1.5.0`
- Footer mobilde alt navigasyon arkasında gizleniyordu → `pb-[calc(4rem+env(safe-area-inset-bottom))]` düzeltmesi
- `haptic.js` — Web Vibration API sarmalayıcı (`hapticLight`, `hapticMedium`, `hapticBookmarkAdd/Remove`, `hapticStrong`)
- `BookmarkButton.jsx` ve `Navigation.jsx` mobil sekme butonlarına haptic eklendi
- **Cron düzeltmesi:** Vercel Hobby `*/30 * * * *` geçersiz → `0 9 * * *` (günlük)
- `breaking-news` cron penceresi 25 saate, günlük limit 1'e güncellendi
- Mevcut 3 cron Hobby planıyla uyumlu: `0 4`, `0 9`, `0 17`

---

### v1.6.0 — AI Kalite Atlaması
**Durum:** Tamamlandı

Güvenilirlik skorlaması ve bağlamsal analiz köklü iyileştirildi.

**Prompt yeniden yazımları:**
- `scorePrompt.js`: eşikler yeniden dengelendi (`reliable ≥60`, `unreliable <35`), bilinen Türk yayın organlarına varsayılan `sourceReputation ≥65`, yalnızca başlık mevcut olduğunda ceza verilmez
- `contextPrompt.js`: kanıta dayalı yöntem — yalnızca doğrulanmış olgular, spekülatif iddialar `"iddia edildiğine göre"` ile etiketlenir, tüm aktörlere eşit şüpheyle yaklaşılır, hafif muhalif ton
- `scorePrompt.js` + `contextPrompt.js`'e 4 eksik kategori eklendi: `economy`, `sports`, `entertainment`, `environment`

**Skor motoru yeniden mimarisi:**
- Skor modeli `FAST (8B) → BALANCED (70B)` — kalibreli sayısal puanlama için daha güçlü model
- `overallScore` formülü prompttan kaldırıldı → JS'de hesaplanıyor (AI artık formülü bilerek hedef skor oluşturamaz)
- `verdict` de JS'de belirleniyor: `≥60 reliable | 35-59 questionable | <35 unreliable`
- Score temperature `0.2 → 0.1` (deterministik), context temperature `0.3 → 0.35` (daha derin analiz)
- Score maxTokens `1800 → 900` (JSON kompakttır, gereksiz token israfı önlendi)

**Yeni alanlar:**
- `missingContext` → `checkThis`: "eksik bilgi" yerine "bunu doğrulamak için şuraya bak" — halüsinasyon azaltıldı
- `relatedStories` (uydurma başlıklar) → `relatedTopics` (konu tavsiyeleri) — halüsinasyon azaltıldı
- UI geriye dönük uyumlu: eski cache değerleri `?? fallback` ile destekleniyor

**Admin:**
- "🔄 Skor Önbelleğini Temizle" butonu eklendi — `analyze:*` Redis key'lerini Redis SCAN ile toplu siler
- `/api/admin` route'a `clear-analysis-cache` action eklendi

---

### v1.6.1 — Push Modal UX
**Durum:** Tamamlandı

- `PushNotificationToggle`'a `onSubscribed` callback prop eklendi
- İzin verilince modal ✅ tebrik durumuna geçiyor: "Bildirimler aktif! 👌"
- 2.5 saniye sonra modal otomatik kapanıyor ve bir daha gösterilmiyor
- Kullanıcı reddettiğinde veya modal kapatıldığında eski davranış korunuyor

---

### v1.6.2 — Kategori Tekil Kaynak ← GÜNCEL
**Durum:** Tamamlandı

- `CATEGORIES` dizisi `siteConfig.js`'e taşındı — tek kaynak (single source of truth)
- `Navigation.jsx` ve `settings/page.jsx` artık oradan import ediyor
- Settings sayfasına eksik kategoriler eklendi: Bilim, Kültür, Savunma, Yaşam (7 → 11)
- Yeni kategori eklemek için artık yalnızca `siteConfig.js` düzenlenmesi yeterli

---

### v1.7.0 — Günlük Özet Mimarisi Yenilendi ✅ (Güncel)

- `dailySummary.js` komple yeniden yazıldı: tek Gemini grounding çağrısı → **4 paralel bağımsız grounding çağrısı** (haber analizi, piyasalar, hava durumu, dünya haberleri)
- Yeni önbellek anahtarı: `daily-summary-v6` (eski: `v5`)
- Hava durumu: `tempRange` → `tempHigh` + `tempLow` + `humidity` (nem) — her alan ayrı
- Piyasalar: `bist100Change` (% değişim) + `goldGram` (gram altın TL) alanları eklendi
- Dünya haberleri: ayrı grounding çağrısıyla alınıyor — karışma riski sıfır
- `getSummaryByDate()` arşiv işlevi `v6` öneki ile korundu
- `summary/page.jsx`: `tempRange` backward-compatible, piyasa grid'ine altın + % değişim eklendi, nem göstergesi eklendi
- Tailwind duplicate `dark:divide-*` class çakışmaları düzeltildi (5 nokta)
- `calcIssueNumber()` taban tarihi: `2026-01-01` → `2024-01-01`
- Admin panel `clear-cache` eylemi artık `v6` anahtarlarını da temizliyor

---

### v1.7.1 — Gerçek Zamanlı Piyasa & Hava Verisi ✅ (Güncel)

- Yeni dosya: `lib/realTimeData.js` — AI olmadan gerçek API'lerden veri çeker
- **Hava durumu**: Open-Meteo API (ücretsiz, API key gerektirmez) — `tempHigh`, `tempLow`, `humidity`, `condition` WMO kodundan üretilir, yağış ihtimali > %50 ise notta gösterilir, 30 dk önbellek
- **Piyasalar**: Yahoo Finance API (ücretsiz, API key gerektirmez) — BIST 100 (`XU100.IS`), USD/TRY, EUR/TRY, gram altın (GC=F/31.1035 × USD/TRY), `bist100Change` %, 15 dk önbellek
- `dailySummary.js` `fetchMarkets()` ve `fetchWeather()` Gemini grounding çağrıları kaldırıldı
- `generateDailySummary()` artık **2 Gemini grounding** (haber analizi + dünya haberleri) + **2 doğrudan API** çağrısı yapıyor
- JSON parse hatası sorunu tamamen ortadan kalktı — piyasa/hava için AI yok

---

## 🔜 Planlanan Sürümler

---

### v1.8.0 — Feed Keşif İyileştirmeleri
**Öncelik:** 🟠 Yüksek | **Tahmini süre:** 3-4 saat

- **Infinite scroll:** `NewsFeed.jsx`'te `IntersectionObserver` — "Daha fazla" butonu kaldırılıyor, ilk 10 haber, her geçişte +10, liste sonunda skeleton
- **Arama otomatik tamamlama:** `SearchBar.jsx`'te debounced dropdown, son 5 arama (localStorage), popüler kategori kısayolları, `Esc` kapat / `↑↓` navigasyon
- **Makale içi ilgili haberler:** Haber detay sayfası altında aynı kategoriden 3 kart (yatay scroll mobil, grid desktop)
- **Teknik borç:** `next/image` migrasyonu (`<img>` → `<Image>`), `analyzeArticle` paralel çağrı (`Promise.all`)

---

### v1.8.1 — Teknik Borç Patch
**Öncelik:** 🟠 Yüksek | **Tahmini süre:** 1-2 saat

- `api/compare/route.js`: `console.error` → `devWarn`
- `category/[slug]/page.jsx`: `CATEGORIES` tekrar `categoryConfig.js`'te — tekilleştir
- `lib/news.js`: tutarsız error handling — tüm `catch` aynı pattern

---

### v1.8.0 — İçerik Zenginleştirme
**Öncelik:** 🟠 Yüksek | **Tahmini süre:** 4-5 saat

- **Trending Topics:** Son 50 haberin başlıklarından stop-word filtreli kelime frekansı, ana sayfada büyüklüğü frekansa göre pill'ler, Redis 30dk cache, tıklayınca arama
- **Haber Kartı Görünüm Modu:** `▦ Kart / ☰ Liste / ▤ Kompakt` seçici, tercih localStorage'a kaydedilir
- **Klavye kısayolları:** `j/k` → sonraki/önceki haber, `b` → bookmark, `s` → paylaş, `?` → yardım modalı

---

### v1.9.0 — Ses & Erişilebilirlik
**Öncelik:** 🟡 Orta | **Tahmini süre:** 3-4 saat

- **Sesli okuma (TTS):** `ReadingToolbar.jsx`'e 🎧 butonu, `window.speechSynthesis` Türkçe `tr-TR`, oynat/duraklat/durdur, mevcut cümle highlight
- **Metin boyutu ayarı:** Settings'te `A- / A / A+ / A++`, CSS `--reading-size` değişkeni, haber ve özet sayfalarında etkin
- **Baskı / Okuyucu Modu:** `@media print` kuralları, `window.print()` butonu, dekoratif öğeler gizlenir

---

### v1.10.0 — Günlük E-posta Digest
**Öncelik:** 🟡 Orta | **Tahmini süre:** 4-5 saat

- Resend veya Brevo ile HTML email şablonu — günün manşeti + 5 önemli haber
- `/api/digest/send` — push-notify cron'dan tetiklenir
- Settings'te e-posta abonelik yönetimi (`digest:subscribers` Redis key'i zaten var)
- Unsubscribe linki: HMAC token

---

### v2.0.0 — Kullanıcı Hesapları & Kişiselleştirme
**Öncelik:** 🟡 Orta (büyük sprint) | **Tahmini süre:** 3-5 gün

MAJOR versiyon — veritabanı şeması ve auth altyapısı.

- `NextAuth.js` veya `Clerk` entegrasyonu (Google + e-posta magic link)
- Bookmark'lar, okuma geçmişi ve tercihler hesaba bağlı (artık yalnızca localStorage değil)
- Kişiselleştirilmiş feed: hesaba bağlı kategori ağırlıkları ve okuma kalıpları
- Admin panelinde kullanıcı yönetimi
- Redis → Upstash per-user key namespace

---

### v2.1.0 — Gamification
**Öncelik:** 🟡 Orta | **Tahmini süre:** 4-5 saat

- **Günün Haber Quizi:** Günlük özetten AI ile 3 çoktan seçmeli soru üretilir, Redis cache, `/quiz` sayfası, kart flip animasyonu, skor gösterimi
- **Streak sayacı:** Kaç gün arka arkaya okuma/quiz yaptın (localStorage → hesap bağlandıktan sonra Redis)
- Günlük özet sayfasına "Bugünü ne kadar takip ettin? 🎯" CTA

---

### v2.2.0 — AI Ton & Taraflılık Katmanı
**Öncelik:** 🟠 Yüksek (güçlü differentiator) | **Tahmini süre:** 3-4 saat

- `ArticleAnalysis.jsx`'e yeni sekme: "🎭 Ton Analizi"
- Prompt: haberin duygusal tonu (nötr/olumsuz/olumlu/alarm), anlatı çerçevesi, eksik perspektifler
- Renk kodlu ton göstergesi: kırmızı (alarm) → sarı (nötr) → yeşil (yapıcı) yatay bar
- `scorePrompt.js`'e `toneScore` ve `biasIndicators` alanları

---

### v2.3.0 — RSS Feed & SEO Tamamlama
**Öncelik:** 🟢 Düşük | **Tahmini süre:** 2-3 saat

- `/feed.xml` — günlük özet + son 20 haber, App Router `Response` ile XML
- `layout.js`'e `<link rel="alternate" type="application/rss+xml">` meta
- Makale sayfaları için dinamik `generateMetadata` — `og:image`, `og:description` her haber için farklı
- JSON-LD `NewsArticle` şemasını haber detay sayfasına taşı

---

### v2.4.0 — Çoklu Dil (i18n)
**Öncelik:** 🟢 Düşük | **Tahmini süre:** 1-2 gün

- `next-intl` paketi
- `/en` prefix ile İngilizce UI
- AI özet dili kullanıcı diline göre otomatik ayarlanır
- İngilizce haberler için İngilizce analiz, Türkçe haberler için Türkçe

---

### v3.0.0 — Platform
**Öncelik:** 🟢 Uzun vadeli | **Tahmini süre:** 1-2 hafta

MAJOR versiyon — uygulamadan platforma geçiş.

- Kullanıcıların kendi RSS kaynaklarını ekleyebilmesi
- Özel bildirim kuralları: "X anahtar kelimesi geçince bildir"
- Haber paylaşım / yorum katmanı
- API erişimi (developer tier)
- Ücretli plan altyapısı (Stripe)

---

## Teknik Borç

| Dosya                      | Sorun                                                                     | Hedef Sürüm |
| -------------------------- | ------------------------------------------------------------------------- | ----------- |
| `api/compare/route.js`     | `console.error` → `devWarn`'a taşınmamış                                  | v1.7.1      |
| `NewsCard.jsx`             | `<img>` tag → `next/image`                                                | v1.8.0      |
| `category/[slug]/page.jsx` | `CATEGORIES` objesi `categoryConfig.js`'te tekrarlıyor                    | v1.7.1      |
| `lib/news.js`              | Error handling tutarsız, `catch` blokları farklı pattern                  | v1.7.1      |
| `analyzeArticle.js`        | Score ve context sıralı çalışıyor → `Promise.all` ile paralel yapılabilir | v1.8.0      |

---

## Performans Hedefleri

| Metrik                 | Şimdiki | Hedef    | Sürüm             |
| ---------------------- | ------- | -------- | ----------------- |
| Lighthouse Performance | ~78     | 90+      | v2.0              |
| LCP                    | ~2.2s   | <1.5s    | v1.7 (next/image) |
| CLS                    | ~0.10   | <0.05    | v1.7 (next/image) |
| INP                    | ~120ms  | <100ms   | v2.0              |
| Redis key sayısı       | ~800+   | optimize | v1.8              |

---

## Versiyon Kuralları

| Değişiklik Türü                            | Sürüm             | Örnek                        |
| ------------------------------------------ | ----------------- | ---------------------------- |
| Yeni büyük özellik (auth, platform)        | **MAJOR** `x.0.0` | `2.0.0` Kullanıcı hesapları  |
| Yeni özellik, yeni API route, yeni bileşen | **MINOR** `x.y.0` | `1.7.0` Infinite scroll      |
| Prompt tweaki, hata düzeltme, küçük UX     | **PATCH** `x.y.z` | `1.6.2` Kategori tek kaynak  |
| Cron/config/altyapı düzeltmesi             | **PATCH** `x.y.z` | `1.5.1` Cron limit sabitleme |
ROADMAP_EOF`, and this is the output of running that command instead:


[... PREVIOUS OUTPUT TRUNCATED ...]

rver usage: Route /category/[slug] couldn't be re
ndered statically because it used no-store fetch https://www.hurriyet.com.tr/rss
/anasayfa /category/[slug]. See more info here: https://nextjs.org/docs/messages
/dynamic-server-error
[rss] Hata Sabah: Dynamic server usage: Route /category/[slug] couldn't be rende
red statically because it used no-store fetch https://www.sabah.com.tr/rss/anasa
yfa.xml /category/[slug]. See more info here: https://nextjs.org/docs/messages/d
ynamic-server-error
[rss] Hata Dünya Gazetesi: Dynamic server usage: Route /category/[slug] couldn't
 be rendered statically because it used no-store fetch https://www.dunya.com/rss
 /category/[slug]. See more info here: https://nextjs.org/docs/messages/dynamic-
server-error
[rss] Hata Bloomberg HT: Dynamic server usage: Route /category/[slug] couldn't b
e rendered statically because it used no-store fetch https://www.bloomberght.com
/rss /category/[slug]. See more info here: https://nextjs.org/docs/messages/dyna
mic-server-error
[rss] Hata Haberturk: Dynamic server usage: Route /category/[slug] couldn't be r
endered statically because it used no-store fetch https://www.haberturk.com/rss 
/category/[slug]. See more info here: https://nextjs.org/docs/messages/dynamic-s
erver-error
[rss] Hata Ekonomim: Dynamic server usage: Route /category/[slug] couldn't be re
ndered statically because it used no-store fetch https://www.ekonomim.com/rss /c
ategory/[slug]. See more info here: https://nextjs.org/docs/messages/dynamic-ser
ver-error
[rss] Hata Hürriyet Ekonomi: Dynamic server usage: Route /category/[slug] couldn
't be rendered statically because it used no-store fetch https://www.hurriyet.co
m.tr/rss/ekonomi /category/[slug]. See more info here: https://nextjs.org/docs/m
essages/dynamic-server-error
[rss] Hata Sözcü Ekonomi: Dynamic server usage: Route /category/[slug] couldn't 
be rendered statically because it used no-store fetch https://www.sozcu.com.tr/f
eeds-rss-category-ekonomi /category/[slug]. See more info here: https://nextjs.o
rg/docs/messages/dynamic-server-error
[rss] Hata Fanatik: Dynamic server usage: Route /category/[slug] couldn't be ren
dered statically because it used no-store fetch https://www.fanatik.com.tr/rss.x
ml /category/[slug]. See more info here: https://nextjs.org/docs/messages/dynami
c-server-error
[rss] Hata Fotomaç: Dynamic server usage: Route /category/[slug] couldn't be ren
dered statically because it used no-store fetch https://www.fotomac.com.tr/rss/a
nasayfa.xml /category/[slug]. See more info here: https://nextjs.org/docs/messag
es/dynamic-server-error
[rss] Hata Sözcü Spor: Dynamic server usage: Route /category/[slug] couldn't be 
rendered statically because it used no-store fetch https://www.sozcu.com.tr/feed
s-rss-category-spor /category/[slug]. See more info here: https://nextjs.org/doc
s/messages/dynamic-server-error
[rss] Hata Hürriyet Spor: Dynamic server usage: Route /category/[slug] couldn't 
be rendered statically because it used no-store fetch https://www.hurriyet.com.t
r/rss/spor /category/[slug]. See more info here: https://nextjs.org/docs/message
s/dynamic-server-error
[rss] Hata Sağlık Haberleri: Dynamic server usage: Route /category/[slug] couldn
't be rendered statically because it used no-store fetch https://www.haberler.co
m/saglik/rss/ /category/[slug]. See more info here: https://nextjs.org/docs/mess
ages/dynamic-server-error
[rss] Hata ShiftDelete: Dynamic server usage: Route /category/[slug] couldn't be
 rendered statically because it used no-store fetch https://shiftdelete.net/feed
 /category/[slug]. See more info here: https://nextjs.org/docs/messages/dynamic-
server-error
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | tail -20
├ ƒ /api/summarize
├ ƒ /api/summary
├ ƒ /api/unsubscribe
├ ƒ /apple-icon
├ ƒ /category/[slug]
├ ƒ /icon
├ ƒ /news/[slug]
├ ○ /offline
├ ƒ /opengraph-image
├ ○ /robots.txt
├ ○ /saved
├ ƒ /search
├ ○ /settings
├ ○ /sitemap.xml
└ ƒ /summary


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "Error|error|✓ Com
piled|Failed|Type error" | grep -v "node_modules\|Dynamic server\|\[rss\]" | hea
d -20
> Build error occurred
Error: Turbopack build failed with 1 errors:
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -A 20 "Build error\|e
rror TS\|SyntaxError\|Cannot find\|is not defined\|Unexpected" | grep -v node_mo
dules | head -40
> Build error occurred
Error: Turbopack build failed with 1 errors:
./src/app/lib/rssSources.js:692:9
Parsing ecmascript source code failed
  690 |   {
  691 |     id: "hurriyet",
> 692 |     name: "Hürriyet",
      |         ^
  693 |     url: "https://www.hurriyet.com.tr/rss/anasayfa",
  694 |     categories: ["politics", "world", "business"],
  695 |     lang: "tr",

Expected ';', '}' or <eof>

Import traces:
  App Route:
    ./src/app/lib/rssSources.js
    ./src/app/api/admin/rss-test/route.js

  Server Component:
    ./src/app/lib/rssSources.js
➜  ai-news-digest git:(main) ✗  head -687 src/app/lib/rssSources.js > /tmp/rssSo
urces_clean.js && mv /tmp/rssSources_clean.js src/app/lib/rssSources.js && wc -l
 src/app/lib/rssSources.js
     687 src/app/lib/rssSources.js
➜  ai-news-digest git:(main) ✗  tail -10 src/app/lib/rssSources.js && echo "---"
 && npx next build 2>&1 | grep -E "✓ Compiled|Build error|error TS|Parsing" | gr
ep -v "node_modules\|Dynamic server\|\[rss\]" | head -5
export function getSourcesByCategory(category) {
  return RSS_SOURCES.filter((s) => s.categories.includes(category)).sort(
    (a, b) => a.priority - b.priority,
  );
}

// Tüm unique URL'leri al (tekrar etmeden)
export function getAllSources() {
  return RSS_SOURCES.sort((a, b) => a.priority - b.priority);
}
---
✓ Compiled successfully in 16.9s
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "✓ Compiled|Build 
error|Parsing ecma|error TS|SyntaxError" | head -10
✓ Compiled successfully in 8.4s
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "✓ Compiled|Build 
error|SyntaxError|Parsing ecma" | head -5
✓ Compiled successfully in 9.4s
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "✓ Compiled|Build 
error|SyntaxError|Parsing ecma|error TS" | head -5
> Build error occurred
Parsing ecmascript source code failed
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "error|Error" | gr
ep -v "node_modules" | head -10
> Build error occurred
Error: Turbopack build failed with 1 errors:
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -A5 "Parsing ecma"
Parsing ecmascript source code failed
  207 |           {/* ── Service Worker ── */}
  208 |           <ServiceWorkerRegistration />
> 209 |         </ThemeProvider>
      |                         ^
> 210 |       </body>
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "✓ Compiled|Build 
error|SyntaxError|Parsing ecma|error TS" | head -5
✓ Compiled successfully in 10.4s
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "✓ Compiled|Build 
error|SyntaxError|Parsing ecma" | head -5
✓ Compiled successfully in 10.7s
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "✓ Compiled|Build 
error|SyntaxError|Parsing ecma|error TS" | head -5
> Build error occurred
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -A5 "Parsing ecma\|Sy
ntaxError\|error TS" | head -20
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -v "node_modules" | t
ail -20
  277 |     setToast(null);
  278 |     try {

the name `loadAnalytics` is defined multiple times

Import traces:
  Client Component Browser:
    ./src/app/components/AdminDashboard.jsx [Client Component Browser]
    ./src/app/components/AdminShell.jsx [Client Component Browser]
    ./src/app/components/AdminShell.jsx [Server Component]
    ./src/app/admin/page.jsx [Server Component]

  Client Component SSR:
    ./src/app/components/AdminDashboard.jsx [Client Component SSR]
    ./src/app/components/AdminShell.jsx [Client Component SSR]
    ./src/app/components/AdminShell.jsx [Server Component]
    ./src/app/admin/page.jsx [Server Component]


    at <unknown> (./src/app/components/AdminDashboard.jsx:275:9)
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "✓ Compiled|Build 
error|SyntaxError|Parsing ecma" | head -5
✓ Compiled successfully in 10.3s
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "✓ Compiled|Build 
error|SyntaxError|Parsing ecma" | head -5
✓ Compiled successfully in 10.9s
➜  ai-news-digest git:(main) ✗  grep -n "push\|vibrate\|notification" /Users/mur
athudavendigaroncu/Desktop/ai-news-digest/public/sw.js | head -20
142:self.addEventListener("push", (event) => {
162:      vibrate: [200, 100, 200],
170:self.addEventListener("notificationclick", (event) => {
171:  event.notification.close();
172:  const url = event.notification.data?.url ?? "/summary";
➜  ai-news-digest git:(main)  npx next build 2>&1 | grep -E "✓ Compiled|Build er
ror|SyntaxError|Parsing ecma|error TS" | head -5
✓ Compiled successfully in 12.4s
➜  ai-news-digest git:(main) ✗ 
➜  ai-news-digest git:(main) ✗  ls /Users/murathudavendigaroncu/Desktop/ai-news-
digest/src/app/api/cron/
 breaking-news   daily-summary   midnight-reset   push-notify
➜  ai-news-digest git:(main)  find /Users/murathudavendigaroncu/Desktop/ai-news-
digest/src/app/api/cron -name "route.js" 2>/dev/null
/Users/murathudavendigaroncu/Desktop/ai-news-digest/src/app/api/cron/midnight-re
set/route.js
/Users/murathudavendigaroncu/Desktop/ai-news-digest/src/app/api/cron/daily-summa
ry/route.js
/Users/murathudavendigaroncu/Desktop/ai-news-digest/src/app/api/cron/push-notify
/route.js
/Users/murathudavendigaroncu/Desktop/ai-news-digest/src/app/api/cron/breaking-ne
ws/route.js
➜  ai-news-digest git:(main)  npx next build 2>&1 | grep -E "✓ Compiled|Build er
ror|SyntaxError|Parsing ecma|error TS" | head -5
✓ Compiled successfully in 9.0s
➜  ai-news-digest git:(main) ✗ 
 npx next build 2>&1 | grep -E "✓ Compiled|Build error|SyntaxError|Parsing ecma|
error TS" | head -5
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "✓ Compiled|Build 
error|SyntaxError|Parsing ecma|error TS" | head -5
^C
 npx next build 2>&1 | tail -5                                                  
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | tail -5
^C
 npx next build 2>&1 | grep -E "Compiled|Build error|error" | grep -v node_modul
es | head -5
➜  ai-news-digest git:(main) ✗  npx next build 2>&1 | grep -E "Compiled|Build er
ror|error" | grep -v node_modules | head -5
^C
 node --input-type=module < /Users/murathudavendigaroncu/Desktop/ai-news-digest/
src/app/lib/newsSource.js 2>&1 | head -5
➜  ai-news-digest git:(main) ✗  node --input-type=module < /Users/murathudavendi
garoncu/Desktop/ai-news-digest/src/app/lib/newsSource.js 2>&1 | head -5
node:internal/modules/esm/resolve:275
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/murathudavendigaroncu/D
esktop/ai-news-digest/news' imported from /Users/murathudavendigaroncu/Desktop/a
i-news-digest/[eval1]
➜  ai-news-digest git:(main) ✗  cat > /Users/murathudavendigaroncu/Desktop/ai-ne
ws-digest/ROADMAP.md << 'ROADMAP_EOF'
heredoc> # HaberAI — Sürüm Yol Haritası
heredoc> 
heredoc> > Son güncelleme: 3 Mart 2026  
heredoc> > Aktif sürüm: **v1.6.2**  
heredoc> > Versiyon kuralı: `MAJOR.MINOR.PATCH`  
heredoc> > — MAJOR: tam yeniden tasarım veya kırıcı değişiklik  
heredoc> > — MINOR: yeni özellik veya önemli iyileştirme  
heredoc> > — PATCH: hata düzeltme, prompt tweaki, küçük UX iyileştirmesi
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## ✅ Yayınlanan Sürümler
heredoc> 
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İlk Kararlı Yayın
heredoc> **Durum:** Tamamlandı
heredoc> 
heredoc> Temel haberveri akışı ve PWA altyapısı.
heredoc> 
heredoc> - Next.js App Router + Vercel Hobby deployment
heredoc> - NewsData.io + RSS kaynaklarından haber çekme
heredoc> - AI destekli haber özeti (Groq Llama)
heredoc> - Güvenilirlik analizi ve bağlamsal analiz (`analyzeArticle`)
heredoc> - Kategori sayfaları (`/category/[slug]`)
heredoc> - Bookmark sistemi (`useBookmarks` + `/saved`)
heredoc> - PWA manifest, service worker, offline sayfası
heredoc> - Dark/light mod (`next-themes`)
heredoc> - Admin paneli temel görünüm
heredoc> - `siteConfig.js` merkezi yapılandırma
heredoc> 
heredoc> ---
heredoc> 
heredoc> ### v1# HaberAI — Sürüm Yol Haritası
heredoc> 
heredoc> > Son güncelleme: 3 Mart 2026  
heredoc> > Aktif sürümı
heredoc> > Son güncelleme: 3 Mart 2026  
heredoc> esk> Aktif sürüm: **v1.6.2**  
heredoc> >An> Versiyon kuralı: `MAJOR.Mü> — MAJOR: tam yeniden tasarım veya kus>
 — MINOR: yeni özellik veya önemli iyileştirme  
heredoc> > — Pl > — PATCH: hata düzeltme, prompt tweaki, küçük -h
heredoc> ---
heredoc> 
heredoc> ## ✅ Yayınlanan Sürümler
heredoc> 
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İlk Kararl<ffffffff><ffffffff>e
heredoc> #k K
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İlk Kaı
heredoc> 
heredoc> #am **Durum:** Tamamlandı
heredoc> 
heredoc> Temel habe<ffffffff>z
heredoc> Temel haberveri akı
heredoc> 
heredoc> -
heredoc> - Next.js App Router + Vercel Hobby deploy?? - NewsData.io + RSS kaynak
larından haber çe?? AI destekli haber özeti (Groq Llama)
heredoc> - Güvece- Güvenilirlik analizi ve bağlamsal , - Kategori sayfaları (`/c
ategory/[slug]`)
heredoc> - Bookmark sistemi ş- Bookmark sistemi (`useBookmarks` + `/sash- PWA ma
nifest, service worker, offline sayfah - Dark/light mod (`next-themes`)
heredoc> - Admin panelita- Admin paneli temel görünüm`/- `siteConfig.js` merkezi
 yap?         
heredoc> ---
heredoc> 
heredoc> ### v1# HaberAI — Sürüm Yol Hw.j
heredoc> # pu
heredoc> > Son güncelleme: 3 Mart 2026  
heredoc> > AktiPus> Aktif sürümı
heredoc> > Son güncelct> Son güncellemy esk> Aktif sürüm: **v1.6.2**  s>An> Vers
iyon kuralı: `MAJOR.M'? — Pl > — PATCH: hata düzeltme, prompt tweaki, küçük -h
heredoc> ---
heredoc> 
heredoc> ## ✅ Yayınlanan Sürümler
heredoc> 
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İlk rcel---
heredoc> 
heredoc> ## ✅ Yayınlanan Sürümler
heredoc> 
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İlk Kai<ffffffff>#etm
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İlk Kaera
heredoc> #one#k K
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İlkti---
heredoc> -
heredoc> #erc
heredoc> #am **Durum:** Tamamlanu 
heredoc> Temel habe<ffffffff>z
heredoc> Temel habe
heredoc> - ATemel haberar
heredoc> -
heredoc> - Next.js App Rosecti- Güvece- Güvenilirlik analizi ve bağlamsal , - Ka
tegori sayfaları (`/category/[slug]`)
heredoc> - Bookmark sistemi ş- Bookmark sistem s- Bookmark sistemi ş- Bookmark s
istemi (`useBookmarks` + `/sash- PWA manifest, service wooa- Admin panelita- Adm
in paneli temel görünüm`/- `siteConfig.js` merkezi yap?         
heredoc> ---
heredoc> 
heredoc> ### v1# HaberAI — Sürüm Yol Hw.j
heredoc> # pu
heredoc> > Son güncelri---
heredoc> 
heredoc> ### v1# HaberAI — Sürüm Yol Hw.j
heredoc> # pu
heredoc> > Son güncelleme: 3 Mart 2026  nav
heredoc> #asy# pu
heredoc> > Son güncelleme: 3 Mart 2026[c> S(4> AktiPus> Aktif sürümı
heredoc> > So)]> Son güncelct> Son güns`---
heredoc> 
heredoc> ## ✅ Yayınlanan Sürümler
heredoc> 
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İlk rcel---
heredoc> 
heredoc> ## ✅ Yayınlanan Sürümler
heredoc> 
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İlk Kai<ffffffff>#etm
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İlk Kse
heredoc> #e b
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İndi
heredoc> - **
heredoc> #on 
heredoc> ## ✅ Yayınlanan Sürüy `
heredoc> ---
heredoc> 
heredoc> ### v1.0.0 — İlk Ka`0 
heredoc> #* *---
heredoc> 
heredoc> ### v1.0.0 — İlk Kaeew
heredoc> # cr#one#k K
heredoc> ---
heredoc> 
heredoc> ### v1.0.0ü---
heredoc> 
heredoc> ##imit 1'-
heredoc> #erc
heredoc> #am **Durum:**ut 3 c#am HTemel habe<ffffffff>z
heredoc> Temel habe
heredoc> 0 Temel habe
heredoc> `0- ATemel 
heredoc> 
heredoc> -
heredoc> - Next.js App