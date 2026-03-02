# HaberAI — Geliştirme Yol Haritası

> Son güncelleme: 2 Mart 2026 (v2)  
> Durum: aktif geliştirme

---

## Öncelik Sistemi

- 🔴 **Kritik** — UX veya SEO'yu doğrudan etkiliyor
- 🟠 **Yüksek** — Kullanıcı değeri yüksek, implementasyon orta
- 🟡 **Orta** — Güzel-olsa-iyi özellikler
- 🟢 **Düşük** — Uzun vadeli / nice-to-have

---

## ✅ Tamamlananlar

- [x] Mobil bottom tab bar navigation
- [x] PWA manifest + meta tags
- [x] PWA install prompt modal (Android native + iOS talimat)
- [x] App ikonları — icon.jsx + apple-icon.jsx (ImageResponse)
- [x] SEO: generateMetadata, JSON-LD NewsArticle, robots.js, sitemap.js
- [x] Dinamik OG image (opengraph-image.jsx)
- [x] siteConfig.js — merkezi uygulama konfigürasyonu
- [x] devLog/devWarn — prod'da sessiz logging
- [x] Prod-safe cache badge'leri (AISummary, ArticleAnalysis, NewsComparison)
- [x] Prod-safe hata mesajları (error.jsx dosyaları)
- [x] Footer versiyon numarası
- [x] **Skeleton Loading** — `NewsCardSkeleton.jsx` + `NewsFeed.jsx` load-more entegrasyonu
- [x] **Paylaş Butonu** — `NewsCard.jsx`'e native Share API (clipboard fallback + ✓ animasyonu)
- [x] **Streaming AI (analyze)** — `/api/stream-analyze` SSE + `ArticleAnalysis.jsx` aşamalı render (score önce, context sonra)
- [x] **Haber Arşivi** — `/summary?date=YYYY-MM-DD` + `getSummaryByDate()` + ← → tarih navigasyonu

---

## 🚀 Yapılacaklar

### 🔴 Kritik

#### ✅ 1. `next/image` Migrasyonu
**Neden:** `<img>` tag'i layout shift yaratıyor, Lighthouse CLS skorunu düşürüyor.  
**Yapılanlar:**
- `NewsCard.jsx` içindeki tüm `<img>` → `<Image>` (next/image)
- `sizes` prop ile responsive breakpoint'ler
- `next.config.mjs`'e wildcard `remotePatterns` eklendi: `hostname: "**"` (http + https)

---

#### 2. Skeleton Loading (Shimmer) ✅
**Neden:** Spinner + boş ekran yerine içerik boyutunda placeholder kullanıcı algısını iyileştirir.  
**Ne yapılacak:**
- `NewsCardSkeleton.jsx` bileşeni — kart boyutunda shimmer animasyonu
- `NewsFeed.jsx` içinde `isLoading` durumunda 6x skeleton render
- `DailySummary.jsx` içinde uzun metin bloğu için paragraph skeleton

```jsx
// Tailwind shimmer sınıfı
"animate-pulse bg-stone-800 rounded"
```

---

#### 3. Paylaş Butonu (Native Share API) ✅
**Neden:** Viral büyüme için en basit mekanizma. Tıklama → native paylaşım menüsü.  
**Ne yapılacak:**
- `NewsCard.jsx`'e küçük paylaşım ikonu ekle
- `navigator.share({ title, url })` — desteklemiyorsa URL clipboard'a kopyala
- Toast: "Bağlantı kopyalandı!"

---

### 🟠 Yüksek

#### 4. Streaming AI Responses (SSE) ✅
**Neden:** AI yanıtı gelene kadar kullanıcı boş ekran görüyor. Token token akıtmak çok daha iyi hissettirir.  
**Ne yapılacak:**
- `/api/summarize` → `ReadableStream` + `text/event-stream`
- `/api/analyze` → aynı pattern
- Frontend'de `useStreamSummary` hook — `fetch` + `response.body.getReader()`
- Cursor animasyonu ile yazma efekti

---

#### 5. Web Push Bildirimleri
**Neden:** E-posta aboneliğinden çok daha yüksek açılma oranı (%50+). Günlük özet hazır olunca bildirim.  
**Ne yapılacak:**
- `public/sw.js` — Service Worker (push event listener)
- `push-manager` ile kullanıcı izni al
- Abonelik token'ını Redis'e kaydet
- Cron job: günlük özet üretildikten sonra tüm token'lara push gönder
- Vercel Edge Function veya `/api/push` route

---

#### 6. Haber Arşivi (Tarih Navigasyonu) ✅
**Neden:** Redis'te birden fazla günün özeti zaten cachleniyor — bu değer kullanılmıyor.  
**Ne yapılacak:**
- `/summary?date=2026-03-01` query param desteği
- `summary/page.jsx`'e tarih seçici component (önceki gün / sonraki gün okları)
- Admin panelde kaç günlük cache var göster

---

#### ✅ 7. Okuma Geçmişi
**Neden:** Kullanıcı hangi haberleri okuduğunu bilmek ister. Bookmark'ı tamamlar.  
**Yapılanlar:**
- `useArticleHistory` hook — localStorage `haberai:article-history`, max 100 haber, çapraz sekme senkronizasyonu
- `NewsCard`'da `onClick` ile history'e ekle, `useEffect` ile okunma durumunu kontrol et
- Okunmuş kartlar `opacity-60` + mobilde "✓ okundu" göstergesi
- `/saved` sayfasına "📖 Geçmiş" sekmesi eklendi (sekme sayısı gösteriyor, temizle butonu)  

---

#### 8. Infinite Scroll / Load More
**Neden:** Tüm haberler tek seferde yükleniyor → gereksiz API çağrısı + yavaş ilk render.  
**Ne yapılacak:**
- `NewsFeed.jsx`'e `IntersectionObserver` ile "Daha Fazla Göster" mekanizması
- İlk yükleme: 10 haber, her scroll sonunda +10
- Sayfa sonunda spinner yerine skeleton kart

---

#### 9. Arama Geliştirme — Otomatik Tamamlama
**Neden:** Arama var ama autocomplete/öneri yok.  
**Ne yapılacak:**
- `SearchBar.jsx`'e debounced input + mini dropdown
- Son aramalar localStorage'dan (max 5)
- Popüler kategoriler hızlı erişim önerileri
- `Esc` ile kapat, `↑↓` ile navigasyon

---

#### 26. Tahmini Okuma Süresi
**Neden:** Her haber kartında "2 dk okuma" gibi bir gösterge kullanıcının beklentisini yönetir, profesyonel his verir.  
**Ne yapılacak:**
- `readingTime(text)` util — ortalama 200 kelime/dk hesabı
- `NewsCard.jsx`'te yazar/tarih satırına `· 3 dk` eklenir
- Haber detay sayfasında da gösterilir
- Implementasyon süresi: ~20 dakika

---

#### 27. Sesli Okuma (TTS)
**Neden:** Sabah haberleri, araç kullanımı, erişilebilirlik. Rakip uygulamalarda yok.  
**Ne yapılacak:**
- `ReadingToolbar.jsx`'e 🎧 butonu ekle
- `window.speechSynthesis` API — Türkçe `tr-TR` voice seç
- Oynat / Duraklat / Durdur kontrolü, mevcut cümleyi highlight et
- Ayarlar'a TTS hız seçeneği (0.75× / 1× / 1.25× / 1.5×)

---

#### 28. Günün Haber Quiz'i 🎮
**Neden:** Gamification = retention. Kullanıcı günlük özeti okuduktan sonra 3 soruluk mini quiz yapıyor.  
**Ne yapılacak:**
- `/api/quiz` — günlük özet içeriğinden Gemini ile 3 çoktan seçmeli soru üret, Redis'e cache'le
- `/quiz` sayfası — kart flip animasyonuyla sorular, skor gösterimi
- Günlük özet sayfasının altında "Bugünü ne kadar takip ettin? 🎯" CTA butonu
- LocalStorage'da streak sayacı (kaç gün arka arkaya katıldın)
- Implementasyon süresi: ~3 saat

---

### 🟡 Orta

#### ✅ 10. Pull-to-Refresh (Mobil)
**Neden:** Native uygulama hissi. Mobil kullanıcıların beklediği gesture.  
**Yapılanlar:**
- `hooks/usePullToRefresh.js` — `touchstart`/`touchmove`/`touchend`, rubber-band direnç, 64px eşiği
- `NewsFeed.jsx`'e entegre: çekiş sırasında ok animasyonu (ilerlemeyle döner), bırakınca `router.refresh()`
- "Yenilemek için çek" → "Bırak, yenile!" → "Yenileniyor…" durumları
- 5 dakikalık ISR cache sayesinde gereksiz API isteği atılmaz
- Sadece mobilde görünür (`md:hidden`)

---

#### ✅ 11. Kategori Swipe (Mobil)
**Neden:** Kategoriler arasında swipe ile geçiş native uygulama deneyimi verir.  
**Yapılanlar:**
- `CategorySwipe.jsx` bileşeni — `touchstart`/`touchend` X delta takibi (eşik 60px)
- Sağa swipe → önceki kategori, sola swipe → sonraki
- Mobilde swipe yönünde kenar göstergesi (yarı-şeffaf pill)
- Desktopda sayfa altına ‹ prev | next › butonları
- `category/[slug]/page.jsx`'e entegre edildi, CATEGORY_KEYS sırasını kullanıyor  

---

#### 12. Scroll-to-Top Butonu
**Neden:** Uzun haber listelerinde ihtiyaç var.  
**Ne yapılacak:**
- 400px+ scroll'da sağ alt köşede çıkan amber floating buton
- Smooth scroll to top
- Mobilde bottom bar'ın üzerinde konumlanmalı

---

#### ✅ 13. Haber Puanlama / Önem Skoru Görseli
**Neden:** `NewsScore` bileşeni var ama görünürlüğü düşük.  
**Yapılanlar:**
- Kart üzerinde skor badge her zaman görünür (hover gerekmez), hem mobil hem desktop
- `overallScore >= 80` → 🔥 alev badge
- Score badge'i hem mobilde hem desktopda score yüklenince kalıcı göster  

---

#### ✅ 14. Karanlık / Aydınlık Mod Geçiş Animasyonu
**Neden:** Şu anki mod geçişi anlık — yumuşatma kullanıcı deneyimini iyileştirir.  
**Yapılanlar:**
- `globals.css`'e `*, *::before, *::after` için `transition-property: background-color, border-color, color` (200ms ease)
- `ThemeToggle.jsx`'e `key` prop trick ile spin animasyonu (tema değişiminde ikon döner)

---

#### 15. Makale İçi İlgili Haberler
**Neden:** Kullanıcıyı sitede tutmak için en etkili yöntem.  
**Ne yapılacak:**
- Haber detay sayfasının altında "Benzer Haberler" bölümü
- `/api/news?related=<article_id>` veya aynı kategori + benzer anahtar kelimeler
- 3 kart horizontal scroll (mobil) veya grid (desktop)

---

#### 29. AI Ton & Taraflılık Analizi
**Neden:** En güçlü differentiator. Haberin duygusal tonu ve olası taraflılığı görmek kullanıcıya güç verir.  
**Ne yapılacak:**
- `ArticleAnalysis.jsx`'e yeni sekme: "🎭 Ton Analizi"
- Gemini prompt: haberin tonu (nötr/olumsuz/olumlu/alarm), anlatı çerçevesi, eksik perspektifler
- Renk kodlu ton göstergesi — kırmızı (alarm) → sarı (nötr) → yeşil (olumlu) yatay bar
- `scorePrompt.js`'e `toneScore` ve `biasIndicators` alanları ekle

---

#### 30. Trending Topics (Kelime Skoru)
**Neden:** Hangi konular gündemde? Tek bakışta anlamak için görsel bir ısı haritası.  
**Ne yapılacak:**
- `/api/trending` — son 50 haberin başlıklarından stop-word filtreli kelime frekansı 
- Ana sayfaya "📈 Günün Trendleri" bölümü: büyüklüğü frekansa göre değişen pill'ler
- Her pill tıklanınca o kelimeyle arama sayfasına yönlendir
- Redis'te 30 dk cache

---

#### 31. Klavye Kısayolları
**Neden:** Power user'lar ve masaüstü kullanıcıları için productivity boost.  
**Ne yapılacak:**
- `useKeyboardShortcuts.js` hook — `document.addEventListener("keydown")`
- `j` / `k` → sonraki/önceki haber odağı, `Enter` → haberi aç, `b` → bookmark toggle, `s` → paylaş, `?` → kısayol listesi modalı
- Kısayol listesi `Cmd+K` / `Ctrl+K` ile açılan command palette (`cmdk` paketi veya custom)
- Settings sayfasında kısayolları göster / devre dışı bırak seçeneği

---

#### 32. Haber Kartı Görünüm Modu
**Neden:** Kimi kullanıcı yoğun içerik, kimi sadece başlık listesi ister.  
**Ne yapılacak:**
- Navigation veya NewsFeed başlığında 3 görünüm seçici: `▦ Kart` / `☰ Liste` / `▤ Kompakt`
- **Kart:** mevcut tasarım
- **Liste:** resim yok, başlık + kaynak + süre tek satır
- **Kompakt:** resim küçük thumbnail, 2 satır başlık, çok daha fazla haber aynı ekranda
- Tercih localStorage'a kaydedilir

---

#### ✅ 16. Offline Desteği (Service Worker Cache)
**Neden:** PWA tamamlanması için kritik. Bağlantı kesilince son okunan haberler gösterilmeli.  
**Yapılanlar:**
- `public/sw.js` — cacheFirst (statik), networkFirst (API, 1500ms timeout), staleWhileRevalidate (sayfalar)
- `ServiceWorkerRegistration.jsx` — window load sonrası kayıt
- `OfflineBanner.jsx` — çevrimdışı/yeniden bağlandı durumu (fixed top banner)
- `offline/page.jsx` — offline fallback sayfası

---

#### ✅ 17. Kullanıcı Tercih Ayarları
**Neden:** Kişiselleştirme retention artırır.  
**Yapılanlar:**
- `useUserPreferences.js` hook — localStorage + cross-tab sync
- `/settings` sayfası — tercihli kategoriler, dimReadArticles, AI özet uzunluğu
- `NewsFeed.jsx`'te tercihli kategoriler önce gösterilir
- Navigation'a Ayarlar sekmesi eklendi

---

### 🟢 Düşük / Uzun Vadeli

#### 18. Edge Runtime Migrasyonu
**Ne yapılacak:**
- `/api/news`, `/api/summary`, `/api/daily-summary` → `export const runtime = "edge"`
- Vercel Edge'de global dağıtım, cold start 0ms
- Not: Upstash Redis edge runtime'ı destekler, node:crypto gerektiren route'lar taşınamaz

---

#### 19. `React.memo` Optimizasyonu
**Ne yapılacak:**
- `export default React.memo(NewsCard)` 
- `NewsFeed.jsx`'te `useCallback` ile handler'lar
- `useMemo` ile kategori filtresi hesaplamaları

---

#### 20. Error Tracking (Sentry veya Axiom)
**Neden:** Prod hatalarını gerçek zamanlı görmek için.  
**Ne yapılacak:**
- `@sentry/nextjs` paketi + Vercel integration
- `error.jsx` dosyalarında `Sentry.captureException(error)`
- Admin dashboardda son hata sayısı

---

#### ✅ 21. Analytics (Privacy-First)
**Neden:** Hangi haberler, kategoriler, özellikler kullanılıyor?  
**Yapılanlar:**
- Vercel Analytics aktif (Vercel dashboard'dan enable edildi)
- `/api/admin/analytics` route — Vercel Analytics REST API'sinden son 7 günlük veri çeker
- Admin dashboard'a "📊 Vercel Analytics" section eklendi: tekil ziyaretçi, sayfa görüntüleme, ort. süre, hemen çıkma oranı, en çok ziyaret edilen sayfalar, cihaz dağılımı
- `VERCEL_TOKEN` + `VERCEL_PROJECT_ID` env var gerekli

---

#### ✅ 22. Haber Kaynağı Güvenilirlik Skoru
**Neden:** AI destekli haber uygulamasının güçlü differentiator'ı.  
**Yapılanlar:**
- `sourceCredibility.js` — 60+ kaynak eşlemesi (high/medium/low), `getSourceTier()` + `CREDIBILITY_CONFIG`
- `NewsCard.jsx`'te kaynak adı yanına 🟢 (güvenilir) / 🔴 (dikkatli) badge eklendi
- Orta tier kaynaklar badge almaz (siyasi etiketlemeden kaçınmak için)

---

#### 23. Çoklu Dil Desteği (i18n)
**Neden:** Türkçe-İngilizce haber karışımı var ama UI tamamen Türkçe.  
**Ne yapılacak:**
- `next-intl` paketi
- `/en` prefix ile İngilizce UI
- Haber dilini auto-detect et, UI diline göre özet dili ayarla

---

#### 24. RSS Feed
**Neden:** Power user'lar RSS ile takip etmek ister.  
**Ne yapılacak:**
- `/feed.xml` route — App Router'da `Response` ile XML dön
- Günlük özet + son haberler
- `sitemap.js`'e ekle, layout.js `<head>`'ine `<link rel="alternate">` meta

---

#### 25. A/B Test Altyapısı
**Neden:** NewsCard layout, AI özet uzunluğu gibi kararları veriye dayandırmak için.  
**Ne yapılacak:**
- Vercel Edge Config veya basit cookie bazlı varyant atama
- Admin dashboardda varyant conversion metrikleri

---

#### 33. Günlük E-posta Digest
**Neden:** Push bildirimini kabul etmeyen kullanıcıları geri getirmenin en klassik yolu.  
**Ne yapılacak:**
- `/api/digest/send` — günlük özet oluştuktan sonra cron tetikler
- Resend veya Brevo ile HTML email şablonu — günün manşeti + 5 önemli haber
- `/settings`'te e-posta abonelik yönetimi (zaten `digest:subscribers` Redis key'i var)
- Unsubscribe linki: HMAC token (zaten `CRON_SECRET` ile `api/unsubscribe` var)

---

#### 34. Metin Boyutu & Okunabilirlik Ayarları
**Neden:** Erişilebilirlik. Yaşlı kullanıcılar veya düşük görme yetisi olanlar için kritik.  
**Ne yapılacak:**
- `/settings`'e font boyutu seçici: `A-` / `A` / `A+` / `A++`
- `document.documentElement.style.setProperty("--reading-size", "18px")` CSS var
- Article/summary sayfalarında `reading-size` CSS değişkeni kullanılır
- Satır aralığı ve paragraf genişliği de ayarlanabilir (Orta / Geniş / Tam)

---

#### 35. Animasyonlu Sayaçlar (Admin Dashboard)
**Neden:** Admin paneli daha canlı ve görsel olur, özellikle stats ilk yüklenince.  
**Ne yapılacak:**
- `useCountUp.js` hook — `requestAnimationFrame` ile 0'dan hedef değere 600ms'de animasyon
- Admin dashboard'daki tüm sayısal stat kartlarına ekle (API calls, cache hits, error count)
- Kullanıcı sayfayı her açtığında animasyon çalışır

---

#### 36. Baskı / Okuyucu Modu
**Neden:** Reklamlar, navigasyon ve görseller olmadan temiz baskı. `Ctrl+P` ile otomatik devreye girer.  
**Ne yapılacak:**
- `globals.css`'e `@media print` kuralları: navigasyon gizle, renkler siyah/beyaz, font optimize
- Haber detay sayfasına 🖨️ ikonu — tıklayınca `window.print()`
- Okuyucu modu: tam genişlik, serif font, beyaz arka plan, tüm dekoratif öğeler gizli

---

## Teknik Borç

| Dosya                      | Sorun                                                     | Çözüm                        |
| -------------------------- | --------------------------------------------------------- | ---------------------------- |
| `api/compare/route.js`     | `console.error` devLog'a geçirilmemiş                     | `devLog` kullan              |
| `NewsCard.jsx`             | `<img>` tag                                               | `next/image` migrasyonu      |
| `siteConfig.js`            | Kategori listesi hem burada hem `sitemap.js`'te           | Tek kaynak: siteConfig       |
| `category/[slug]/page.jsx` | `CATEGORIES` objesi hem burada hem `categoryConfig.js`'te | `categoryConfig.js`'i kullan |
| `lib/news.js`              | Error handling tutarsız                                   | Tüm catch'ler aynı pattern   |

---

## Performans Hedefleri

| Metrik                         | Şimdiki Durum | Hedef  |
| ------------------------------ | ------------- | ------ |
| Lighthouse Performance         | ~75           | 90+    |
| LCP (Largest Contentful Paint) | ~2.5s         | <1.5s  |
| CLS (Cumulative Layout Shift)  | ~0.15         | <0.05  |
| FID / INP                      | —             | <100ms |
| TTI (Time to Interactive)      | ~3s           | <2s    |

> `next/image` migrasyonu + skeleton loading tek başına bu hedeflerin büyük kısmını karşılar.

---

## Öneri Sıralaması (Hızlı Başlangıç)

```
1. next/image migrasyonu      ✅ tamamlandı
2. Skeleton loading            ✅ tamamlandı
3. Native Share butonu         ✅ tamamlandı
4. Scroll-to-top butonu        → 15 dakika, UX +
5. Okuma geçmişi               ✅ tamamlandı
6. Streaming AI responses      ✅ tamamlandı
7. Pull-to-Refresh             ✅ tamamlandı
8. Tahmini okuma süresi        → 20 dakika, profesyonel his +
9. Haber kartı görünüm modu    → 2 saat, kişiselleştirme ++
10. Trending Topics            → 2 saat, görsellik +++
11. Günün Quiz'i               → 3 saat, gamification +++
12. AI Ton & Taraflılık        → 2 saat, differentiator +++
13. Klavye kısayolları         → 1 saat, power users +
14. Sesli okuma (TTS)          → 2 saat, erişilebilirlik ++
15. Web Push bildirimleri      → 1 gün, engagement +++
```
