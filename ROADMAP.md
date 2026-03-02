# HaberAI — Geliştirme Yol Haritası

> Son güncelleme: 2 Mart 2026  
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

#### 1. `next/image` Migrasyonu
**Neden:** `<img>` tag'i layout shift yaratıyor, Lighthouse CLS skorunu düşürüyor.  
**Ne yapılacak:**
- `NewsCard.jsx` içindeki `<img>` → `<Image>` (next/image)
- `sizes` prop ile responsive breakpoint'ler
- `placeholder="blur"` + `blurDataURL` (haber API'sinden gelen görseller için low-quality placeholder)
- Harici domain'leri `next.config.mjs`'e ekle: `images.remotePatterns`

```js
// next.config.mjs içine eklenecek
images: {
  remotePatterns: [
    { protocol: "https", hostname: "**.cdninstagram.com" },
    { protocol: "https", hostname: "**.bbc.co.uk" },
    // haber kaynaklarının CDN domainleri
  ]
}
```

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

### 🟡 Orta

#### 10. Pull-to-Refresh (Mobil)
**Neden:** Native uygulama hissi. Mobil kullanıcıların beklediği gesture.  
**Ne yapılacak:**
- `usePullToRefresh` hook — `touchstart` / `touchmove` / `touchend`
- 60px+ aşağı çekilince "Yenileniyor..." animasyonu
- `router.refresh()` çağrısı

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

#### 14. Karanlık / Aydınlık Mod Geçiş Animasyonu
**Neden:** Şu anki mod geçişi anlık — yumuşatma kullanıcı deneyimini iyileştirir.  
**Ne yapılacak:**
- `ThemeProvider.jsx`'e `transition-colors duration-300` ekle (tüm sayfa)
- `ThemeToggle.jsx`'e rotate animasyonu (güneş/ay ikonları)

---

#### 15. Makale İçi İlgili Haberler
**Neden:** Kullanıcıyı sitede tutmak için en etkili yöntem.  
**Ne yapılacak:**
- Haber detay sayfasının altında "Benzer Haberler" bölümü
- `/api/news?related=<article_id>` veya aynı kategori + benzer anahtar kelimeler
- 3 kart horizontal scroll (mobil) veya grid (desktop)

---

#### 16. Offline Desteği (Service Worker Cache)
**Neden:** PWA tamamlanması için kritik. Bağlantı kesilince son okunan haberler gösterilmeli.  
**Ne yapılacak:**
- `public/sw.js` — Cache-first for static, Network-first for API
- Son 20 haberı Cache API'ye yaz
- Offline banner: "Çevrimdışısınız — önbellek gösteriliyor"

---

#### 17. Kullanıcı Tercih Ayarları
**Neden:** Kişiselleştirme retention artırır.  
**Ne yapılacak:**
- `/settings` sayfası (minimal)
- Tercihli kategoriler seç → anasayfada önce onlar görünsün
- Haber dili tercihi (TR / EN)
- AI özeti uzunluğu (kısa / normal / detaylı)
- localStorage'a kaydet

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

#### 21. Analytics (Privacy-First)
**Neden:** Hangi haberler, kategoriler, özellikler kullanılıyor?  
**Ne yapılacak:**
- Vercel Analytics (zaten Vercel'desin, tek tıkla aktif)
- veya Plausible (GDPR uyumlu, çerez yok)
- Admin dashboarda page view + en çok tıklanan kategoriler

---

#### 22. Haber Kaynağı Güvenilirlik Skoru
**Neden:** AI destekli haber uygulamasının güçlü differentiator'ı.  
**Ne yapılacak:**
- News API'den gelen `source.name` bazında önceden tanımlanmış güvenilirlik skoru
- Kartlarda küçük kaynak badge (🟢 Güvenilir / 🟡 Taraflı / 🔴 Dikkatli Ol)
- AI prompt'una kaynak bilgisi ekle → analizde kaynak güvenilirliğini de değerlendir

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
1. next/image migrasyonu      → 1-2 saat, Lighthouse +15 puan
2. Skeleton loading            → 2-3 saat, algılanan hız ++
3. Native Share butonu         → 30 dakika, viral potansiyel
4. Scroll-to-top butonu        → 15 dakika, UX +
5. Okuma geçmişi               → 1 saat, retention +
6. Streaming AI responses      → 3-4 saat, WOW faktörü ++
7. Web Push bildirimleri       → 1 gün, engagement +++
```
