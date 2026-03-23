# HaberAI — Acımasız, Tarafsız, Objektif Analiz Raporu

> Analiz tarihi: 6 Mart 2026  
> Aktif sürüm: v1.8.5  
> Toplam kod: ~19.100 satır JavaScript (TypeScript yok)  
> Analiz eden: Bağımsız teknik denetim

---

## İÇİNDEKİLER

1. [Yönetici Özeti](#1-yönetici-özeti)
2. [Bu Uygulama Para Eder mi?](#2-bu-uygulama-para-eder-mi)
3. [Artılar — Ne İyi Yapılmış?](#3-artılar--ne-iyi-yapılmış)
4. [Eksikler — Ne Kötü?](#4-eksikler--ne-kötü)
5. [Para Kazanmak İçin Hangi Yöne Yüklenmeli?](#5-para-kazanmak-için-hangi-yöne-yüklenmeli)
6. [Rakip Analizi](#6-rakip-analizi)
7. [Teknik Borç ve Riskler](#7-teknik-borç-ve-riskler)
8. [Sonuç ve Eylem Planı](#8-sonuç-ve-eylem-planı)

---

## 1. Yönetici Özeti

HaberAI, Türkçe haber kaynaklarını (RSS + NewsData.io) toplayıp AI ile özetleyen, güvenilirlik skorlayan, bağlamsal analiz yapan ve gazete formatında günlük özet üreten bir PWA. Teknik kalitesi ortalamanın **çok üstünde** — özellikle AI altyapısı (4 provider fallback, 5 katmanlı cache, in-flight dedup) profesyonel düzeyde.

**Ancak:** Bu uygulama şu anda **para kazanmıyor, para kazanacak altyapısı yok** ve gelir modeli tanımlanmamış. Teknik olarak etkileyici ama ticari olarak emekleme aşamasında.

### Skor Kartı

| Alan              | Puan (10 üzerinden) | Not                                      |
| ----------------- | ------------------- | ---------------------------------------- |
| Teknik Kalite     | 8.5                 | Üstün AI altyapısı, cache stratejisi     |
| UI/UX Tasarım     | 8.0                 | Gazete estetiği güçlü, mobil iyi         |
| Ürün-Pazar Uyumu  | 4.0                 | Hedef kitle belirsiz, metrikler yok      |
| Monetizasyon      | 1.0                 | Sıfır gelir altyapısı                    |
| Ölçeklenebilirlik | 5.0                 | Redis-only, ücretsiz API'ler, Hobby plan |
| SEO/Büyüme        | 4.5                 | Temel SEO var, büyüme motoru yok         |
| Güvenlik          | 4.0                 | Zayıf admin auth, rate limit yok         |
| Test Kapsamı      | 0.0                 | Sıfır test dosyası                       |
| Hata İzleme       | 0.0                 | Sentry/LogRocket yok                     |
| Dokümantasyon     | 7.0                 | ROADMAP detaylı, API doc yok             |

**Genel Skor: 4.2 / 10 (ticari hazırlık açısından)**  
**Genel Skor: 7.8 / 10 (teknik kalite açısından)**

---

## 2. Bu Uygulama Para Eder mi?

### Kısa Cevap: Şu haliyle HAYIR.

### Uzun Cevap:

#### Neden Şu An Para Etmez

1. **Gelir modeli yok.** Tek bir satır bile ödeme, abonelik veya reklam kodu yok. Premium özellik ayrımı yok. Stripe, Paddle, veya herhangi bir ödeme entegrasyonu yok.

2. **Kullanıcı hesabı yok.** Tüm veriler localStorage'da. Bookmark'lar, okuma geçmişi, tercihler — hepsi tarayıcıya bağlı. Kullanıcı telefon değiştirse her şey sıfırlanır. Hesap yoksa ödeme de alamazsın.

3. **Hedef kitle tanımsız.** "Türkçe haber okuyan herkes" bir hedef kitle değil. Bu uygulamayı NTV/CNN Türk/Sözcü yerine neden kullansınlar? Haber kaynağı aynı (RSS'ten aynı haberleri çekiyor), sadece AI analizi ekleniyor.

4. **Ücretsiz API bağımlılığı.** Tüm AI çağrıları (Groq, Cerebras, SambaNova, OpenRouter) ücretsiz tier'da. Piyasa verisi (Yahoo Finance), hava durumu (Open-Meteo) da ücretsiz. 1.000 kullanıcıya çıktığında rate limit'lere çarpar.

5. **Ölçek problemi.** Vercel Hobby plan — 60 saniyelik function süresi, 3 cron job limiti. 10.000 DAU seviyesinde bu altyapı çöker.

6. **Metrik yok.** Kaç kullanıcı var? DAU/MAU? Retention? Hangi özellik kullanılıyor? Vercel Analytics eklenmiş ama derinlemesine analitik yok. Veri olmadan para kazanamazsın çünkü neyi sattığını bilmezsin.

#### Para Edebilir Mi?

**EVET** — ama ciddi iş yapılırsa. Açıklayayım:

| Potansiyel | Koşul                       | Gerçekçi Gelir                                    |
| ---------- | --------------------------- | ------------------------------------------------- |
| Düşük      | Reklam modeli (AdSense)     | 50-200 $/ay (100K sayfa görüntüleme ile)          |
| Orta       | Freemium (AI analiz limiti) | 500-2.000 $/ay (1.000 ödeme yapan kullanıcı × $2) |
| Yüksek     | B2B API + Premium           | 5.000-20.000 $/ay (kurumsal müşteriler)           |
| Çok Yüksek | Medya kuruluşlarına SaaS    | 10.000-50.000 $/ay                                |

Gerçekçi olmak gerekirse: **Türkiye pazarında haber için para ödeme isteği düşük.** Kullanıcılar ücretsiz alternatiflere alışık. Bu nedenle B2C gelir potansiyeli sınırlı. Asıl fırsat B2B tarafında.

---

## 3. Artılar — Ne İyi Yapılmış?

### A. AI Altyapısı (Puan: 9/10) ⭐ En Güçlü Yan

Bu uygulamanın en değerli varlığı AI işlem zinciri:

- **4 provider fallback zinciri:** Groq → Cerebras → SambaNova → OpenRouter. Biri 429 verirse 1 saniye bekleyip diğerine geçiyor. Bu, çoğu startup'ın bile yapamadığı düzeyde bir resilience.
- **Model tier sistemi:** FAST (8B) → BALANCED (70B) → SMART (Scout). Basit özetler ucuz modelde, skor analizi güçlü modelde. Akıllı kaynak yönetimi.
- **Gemini grounding:** Günlük özet için Google Search grounding ile gerçek zamanlı bilgi. 4 model fallback zinciri burada da var.
- **5 katmanlı cache:** ISR → Redis → Stale-while-revalidate → In-flight dedup → Client-side cache warming. Bu mimari profesyonel düzeyde.

### B. Günlük Özet Sayfası (Puan: 9/10) ⭐ Differentiator

765 satırlık `summary/page.jsx` — tam bir dijital gazete birinci sayfası:
- Ruh hali bazlı renk teması (7 mod: gergin, umutlu, çalkantılı, vb.)
- Manşet + alt manşet + ana haber + sekonder grid
- Piyasalar (BIST-100, USD/TRY, EUR/TRY, gram altın)
- Hava durumu (10 Türk şehri)
- Günün sayısı, sözü, kelimesi
- Kategorik analiz (siyaset/ekonomi/dünya/teknoloji/spor)
- Dünya haberleri bölgesel grid
- Tarihte bugün
- Editör notu
- Arşiv navigasyonu
- Sesli okuma (TTS)

Bu, Türkiye'de başka hiçbir haber uygulamasında olmayan bir özellik. **Tek başına monetize edilebilir.**

### C. Haber Güvenilirlik Analizi (Puan: 8.5/10)

- Çok boyutlu skor: güvenilirlik, tarafsızlık, duygusal dil, kaynak itibarı
- Overall skor JS tarafında hesaplanıyor (AI'ın skor manipülasyonunu engelliyor)
- Kırmızı/yeşil bayraklar, manipülasyon taktikleri tespiti
- Doğrulanabilir iddialar listesi
- Fact-check önerileri (Google arama linkleri)

### D. Bağlamsal Analiz (Puan: 8.5/10)

- Kronolojik zaman çizelgesi
- Anahtar aktörler ve güç seviyeleri
- Olasılık bazlı gelecek senaryoları
- Terminoloji açıklamaları
- Jeopolitik bağlam

### E. Kaynak Karşılaştırma (Puan: 8/10)

- Aynı haberi farklı kaynaklar nasıl sunuyor analizi
- Kaynak çeşitlilik skoru (0-100)
- Tutum etiketleri (nötr/eleştirel/destekleyici/alarmist)
- Yanlılık uyarısı

### F. Teknik Kararlar

- **PWA tam destek:** Service worker, push bildirimleri, offline sayfa, install prompt
- **Onboarding akışı:** 6 adımlı, atlanabilir, kişiselleştirme
- **Kaynak çeşitliliği:** ~70+ Türk ve uluslararası kaynak, kaynak harmanlaması (aynı kaynak art arda gelmiyor)
- **Haptic feedback:** Mobilde bookmark/navigasyon etkileşimleri
- **Stale-while-revalidate:** Eski veriyi göster, arka planda güncelle — kullanıcı beklemiyor
- **Hover cache warming:** Kullanıcı haberin üzerine geldiğinde analiz pre-fetch ediliyor
- **Gazete tipografisi:** Playfair Display + Source Serif 4 — profesyonel baskı estetiği

---

## 4. Eksikler — Ne Kötü?

### KRİTİK SEVİYE 🔴

#### 1. Sıfır Test Kapsamı
19.100 satır kod, **sıfır test dosyası**. Hiçbir `.test.js`, `.spec.js` yok. Jest, Vitest, Playwright — hiçbiri yok. Bu, profesyonel bir üründe kabul edilemez bir durum.

**Risk:** Herhangi bir değişiklik, farkında olmadan başka bir şeyi kırabilir. Refactor yapamazsın, çünkü doğrulama mekanizman yok. PR review anlamsızlaşır.

**Etki:** Ölümcül. Ticari bir ürün için bu tek başına deal-breaker.

#### 2. Sıfır Hata İzleme
Sentry, LogRocket, Bugsnag — hiçbiri yok. Production'da bir hata olduğunda **bilmiyorsun bile**. `console.error` sunucu loglarında kaybolup gidiyor.

**Risk:** Kullanıcılar sorun yaşar, sen habersizsin. Hangi AI provider çöktü? Hangi sayfa kırıldı? Bilmiyorsun.

#### 3. API Rate Limiting Yok
`/api/summarize`, `/api/analyze`, `/api/compare` — bunlar **tamamen açık endpoint'ler**. Authentication yok, rate limit yok, throttle yok. Herhangi biri bir script yazıp dakikada 1.000 istek atarak tüm AI quota'nı tüketebilir.

**Risk:** Tek bir kötü niyetli kişi tüm ücretsiz API quota'larını bir günde bitirebilir. Tüm kullanıcılar etkilenir.

#### 4. Zayıf Admin Güvenliği
- Admin token: Base64-encoded string (kriptografik imza yok)
- `CRON_SECRET` hem cron auth hem admin token için kullanılıyor
- CSRF koruması yok
- Token reversible — `CRON_SECRET` bilen herkes admin token forge edebilir

#### 5. Kullanıcı Hesabı Yok
- Tüm veri localStorage'da — tarayıcı temizlerse her şey gider
- Cross-device senkronizasyon mümkün değil
- Ödeme almak için hesap sistemi **zorunlu**
- Kişiselleştirme yüzeysel kalıyor (sadece kategori tercihi)

### ÖNEMLİ SEVİYE 🟠

#### 6. TypeScript Yok
19.100 satır düz JavaScript. Runtime type hataları kaçınılmaz. Refactoring tehlikeli. IDE desteği zayıf. Bir ekiple çalışmak zorlayıcı.

#### 7. Ücretsiz API Bağımlılığı
| Kaynak           | Limit             | Risk                       |
| ---------------- | ----------------- | -------------------------- |
| Groq Free        | 30K TPM, 500K TPD | Kota aşımında hizmet durur |
| Cerebras Free    | ~100K TPD         | İstikrarsız, kapanabilir   |
| SambaNova Free   | ~1M TPD           | Beta, SLA yok              |
| OpenRouter Free  | ~20 req/min       | Paylaşımlı, yavaş          |
| NewsData.io Free | 200 req/gün       | Çok düşük                  |
| Yahoo Finance    | Belgesiz          | Her an kapanabilir         |

**Tüm altyapı ücretsiz servisler üzerine kurulu.** Bunların herhangi biri politika değiştirse uygulama çöker. SLA yok, garanti yok.

#### 8. Redis-Only Veri Modeli
- SQL veritabanı yok. Her şey Redis key-value'da
- TTL sonrasında veri kayboluyor (makaleler 7 gün, analizler 7 gün)
- Karmaşık sorgular mümkün değil (kullanıcı davranışı analizi, kohort analizi)
- Veri yedekleme stratejisi yok

#### 9. Vercel Hobby Plan Sınırlamaları
- Max 3 cron job (zaten 3'ü dolu)
- 60 saniye function timeout
- 100GB bandwidth/ay
- Serverless function cold start
- Scale olursa maliyetler hızla artar (Hobby → Pro: $20/ay)

#### 10. SEO Derinliği Yetersiz
- Sitemap'te bireysel makale URL'leri yok
- Makaleler için canonical URL'ler dış kaynaklara yönlendiriyor
- Yapısal veri (JSON-LD) sadece detay sayfasında
- Blog/editoryal içerik yok — organik arama potansiyeli düşük
- RSS output feed yok

### İYİLEŞTİRME SEVİYESİ 🟡

#### 11. Kod Tekrarı
- JSON repair fonksiyonu 4+ dosyada kopyalanmış
- Slug üretme mantığı component içinde (paylaşılan utility olmalı)
- Error handling patternları tutarsız

#### 12. Büyük Component'ler
- `summary/page.jsx`: 765 satır
- `OnboardingFlow.jsx`: 489 satır
- `NewsFeed.jsx`: 488 satır
- `NewsCard.jsx`: 466 satır

Bu dosyalar bakımı zorlaştırıyor. Component decomposition lazım.

#### 13. Hover Debounce Eksik
`NewsCard` her `mouseenter`'da 2 fetch çağrısı yapıyor (article-insight + analyze). Hızlı fare hareketlerinde gereksiz istekler oluşuyor.

#### 14. Image Optimization Eksik
`<img>` tag'ları kullanılıyor, `next/image` değil. LCP ve CLS skorlarını olumsuz etkiliyor.

---

## 5. Para Kazanmak İçin Hangi Yöne Yüklenmeli?

### Strateji 1: Freemium B2C (Gerçekçilik: ★★★☆☆)

**Model:** Temel haberler ücretsiz, AI analiz sınırlı, premium plan aylık 29-49 TL.

| Ücretsiz Katman          | Premium Katman                      |
| ------------------------ | ----------------------------------- |
| Günlük 5 AI özet         | Sınırsız AI özet                    |
| Günlük özet (gecikmeli)  | Günlük özet (anlık)                 |
| Temel güvenilirlik skoru | Tam analiz + bağlam + karşılaştırma |
| 1 ay bookmark geçmişi    | Sınırsız geçmiş + export            |
| Reklamlı                 | Reklamsız                           |
| —                        | Kişiselleştirilmiş AI brifing       |
| —                        | E-posta digest                      |
| —                        | Öncelikli push bildirimleri         |

**Gerekli yatırım:** Hesap sistemi, ödeme entegrasyonu (Stripe/Iyzico), katman yönetimi, en az 3-4 hafta geliştirme.

**Sorun:** Türkiye'de haber için ödeme yapma alışkanlığı çok düşük. Bianet, T24, Medyascope gibi bağımsız medya organları bile bağış modeliyle ayakta duruyor. Aylık 29 TL'ye 1.000 kişi bulmak çok zor.

**Potansiyel gelir:** 500-2.000 $/ay (iyimser senaryoda)

---

### Strateji 2: B2B API/SaaS (Gerçekçilik: ★★★★☆) ⭐ ÖNERİLEN

**Model:** AI haber analiz altyapısını API olarak sat. Hedef müşteriler: medya kuruluşları, PR ajansları, halkla ilişkiler departmanları, finans kurumları, araştırma şirketleri.

**Neden bu yol?**

1. **Zaten güçlü bir altyapın var:** 4-provider fallback, çoklu model tier, güvenilirlik skorlama, bağlamsal analiz, kaynak karşılaştırma — bunları API olarak paketlemek teknik olarak mümkün.

2. **B2B müşteriler ödeme yapar:** Bir PR ajansı günlük 500 haber takip ediyorsa, AI ile otomatik analiz için aylık 500-2.000$ ödemeye hazırdır. Bir finans kurumunun haber sentiment analizi ihtiyacı süreklidir.

3. **Türkçe özelleştirme avantajı:** Uluslararası araçlar (Feedly AI, Meltwater, Cision) Türkçe'de zayıf. Bu bir niş.

**Ürün önerisi:**

```
HaberAI API — Türkçe Haber İstihbaratı

Endpoint'ler:
POST /api/v1/analyze     → Güvenilirlik skoru + bayraklar
POST /api/v1/summarize   → AI özet (kısa/orta/detay)
POST /api/v1/context     → Bağlamsal analiz + senaryolar
POST /api/v1/compare     → Çoklu kaynak karşılaştırma
POST /api/v1/sentiment   → Duygu/ton analizi
GET  /api/v1/trending    → Trend konular + frekans

Fiyatlandırma:
- Starter: 1.000 istek/ay — $49/ay
- Pro: 10.000 istek/ay — $199/ay
- Enterprise: Sınırsız — $999/ay + SLA
```

**Gerekli yatırım:** API key sistemi, rate limiting, kullanım dashboard'u, API dokümantasyonu, Stripe entegrasyonu, ücretli AI API'lerine geçiş (Groq paid, OpenAI, Anthropic). 4-6 hafta geliştirme.

**Potansiyel gelir:** 2.000-20.000 $/ay (10-100 kurumsal müşteri ile)

---

### Strateji 3: Medya Kuruluşlarına White-Label (Gerçekçilik: ★★★★★) ⭐ EN YÜKSEK POTANSİYEL

**Model:** Bu AI analiz motorunu medya kuruluşlarına embed edilebilir widget/SDK olarak sat.

**Senaryo:** Bir haber sitesi (diyelim T24 veya Diken) kendi haberlerinin altına "AI Güvenilirlik Analizi" widgetı eklemek istiyor. HaberAI bunu hazır, embed edilebilir bir çözüm olarak sunuyor.

```html
<!-- Haber sitesine eklenen kod -->
<script src="https://haberai.com/embed.js" data-api-key="xxx"></script>
<div data-haberai-analyze data-url="{{article_url}}"></div>
```

**Fiyatlandırma:** Aylık pageview bazlı. 100K pageview: $199/ay, 1M pageview: $999/ay.

**Neden bu en yüksek potansiyel?**
- Medya kuruluşları güvenilirlik sorunuyla boğuşuyor
- EU AI Act ve dijital medya regülasyonları "AI transparency" zorunluluğu getiriyor
- Türk medyası bu konuda çözümsüz
- Bütünleşik ürün satmak, tüketici uygulaması satmaktan kolay

**Gerekli yatırım:** Embed SDK, iframe/web component, white-label theming, müşteri dashboard'u. 6-8 hafta.

**Potansiyel gelir:** 5.000-50.000 $/ay (5-50 medya partneri ile)

---

### Strateji 4: Reklam Modeli (Gerçekçilik: ★★☆☆☆)

**Model:** Google AdSense veya Türk reklam ağları (Hürriyet AdManager, DoğanMedia vb.)

**Sorun:** 
- Haber sitelerinde CPM çok düşük (Türkiye'de $0.30-1.00 CPM)
- 100.000 sayfa görüntüleme/ay = $30-100/ay
- Reklam UX'i bozar, bu uygulamanın en güçlü yanı temiz tasarım
- AdBlock penetrasyonu yüksek

**Potansiyel gelir:** 50-200 $/ay (gerçekçi trafik ile)

**Tavsiye:** Reklam modeli tek başına sürdürülemez. Sadece freemium'un ücretsiz katmanında tamamlayıcı olarak kullanılabilir.

---

### Strateji 5: Veri/İçgörü Satışı (Gerçekçilik: ★★★☆☆)

**Model:** Türk medya ekosisteminin analitik verilerini raporla ve sat.

- Haftalık/aylık "Türk Medya Güvenilirlik Raporu"
- Kaynak bazlı yanlılık trendleri
- Konu bazlı haber akışı analizi
- Seçim dönemlerinde medya izleme raporları

**Hedef müşteriler:** Akademisyenler, STK'lar, düzenleyici kurumlar (RTÜK), siyasi partiler, PR ajansları.

**Gerekli yatırım:** Veri toplama pipeline'ı, raporlama dashboard'u, PDF export, veri depolama (PostgreSQL gerekli).

**Potansiyel gelir:** 1.000-5.000 $/ay (niş ama değerli)

---

### ÖNERİLEN KOMBİNASYON

```
Kısa vade (0-3 ay):
├── B2C Freemium ile kullanıcı tabanı oluştur
├── Google AdSense ile minimum gelir başlat
└── Hesap sistemi + Stripe/Iyzico entegrasyonu

Orta vade (3-6 ay):
├── B2B API lansmanı
├── 5-10 pilot müşteri (PR ajansları, haber siteleri)
└── Ücretli AI API'lerine geçiş

Uzun vade (6-12 ay):
├── White-label embed SDK
├── Medya partnerlikleri
└── Veri raporlama ürünü
```

---

## 6. Rakip Analizi

### Doğrudan Rakipler (Türkiye)

| Rakip                              | Ne Yapıyor                        | HaberAI Avantajı                        | HaberAI Dezavantajı                        |
| ---------------------------------- | --------------------------------- | --------------------------------------- | ------------------------------------------ |
| Bundle (bundle.app)                | Haber agregatörü, kişiselleştirme | AI analiz derinliği, güvenilirlik skoru | Bundle'ın kullanıcı tabanı, VC desteği var |
| Yaay (yaay.com)                    | Haber özetleri                    | Bağlamsal analiz, kaynak karşılaştırma  | Yaay'ın marka bilinirliği                  |
| Google News TR                     | Algoritma bazlı haber akışı       | Türkçe AI analiz, güvenilirlik skoru    | Google'ın ölçeği, kullanıcı tabanı         |
| Haber uygulamaları (NTV, CNN Türk) | Kendi içeriklerini sunma          | Çoklu kaynak, tarafsız analiz           | Yerleşik kullanıcı tabanları               |

### Dolaylı Rakipler (Global)

| Rakip              | Fiyat        | HaberAI Farkı                                   |
| ------------------ | ------------ | ----------------------------------------------- |
| Feedly AI          | $8-18/ay     | Türkçe'de zayıf                                 |
| Ground News        | $5-10/ay     | Bias analizi benzer ama Türkçe haber kaynağı az |
| Artifact (kapandı) | Ücretsiz idi | Kapandı — pazar validasyonu açısından uyarıcı   |
| AllSides           | Ücretsiz     | Sadece İngilizce, ABD odaklı                    |
| TheSkimm           | $7/ay        | E-posta digest modeli, İngilizce                |

### Önemli Not: Artifact'ın Kapanması

Instagram kurucularının AI haber uygulaması Artifact, 2024'te kapandı. Nedenleri:
- Haber içeriği lisanslama maliyetleri
- Kullanıcı retention düşüklüğü
- Monetizasyon zorluğu

**Bu, B2C haber uygulamasının ne kadar zor bir pazar olduğunun kanıtı.** HaberAI'ın çıkış yolu B2C değil, **B2B/B2B2C olmalı.**

---

## 7. Teknik Borç ve Riskler

### Acil Düzeltilmesi Gerekenler

| #   | Sorun                                        | Etki                   | Süre     |
| --- | -------------------------------------------- | ---------------------- | -------- |
| 1   | API rate limiting ekle                       | Quota tükenmesi riski  | 2-3 saat |
| 2   | Sentry entegrasyonu                          | Hata görünürlüğü sıfır | 1-2 saat |
| 3   | Admin auth güçlendir (JWT + HMAC)            | Güvenlik açığı         | 3-4 saat |
| 4   | En az 20 unit test yaz (AI fonksiyonları)    | Refactor güvenliği     | 1-2 gün  |
| 5   | JSON repair fonksiyonunu tek utility'ye taşı | Kod tekrarı            | 1 saat   |

### Ölçekleme Öncesi Gerekenler

| #   | Sorun                         | Neden                          | Süre     |
| --- | ----------------------------- | ------------------------------ | -------- |
| 6   | PostgreSQL/Supabase ekle      | Kalıcı veri, karmaşık sorgular | 1 hafta  |
| 7   | TypeScript migrasyonu         | Tip güvenliği, ekip çalışması  | 2-3 gün  |
| 8   | Ücretli AI API planlarına geç | SLA, stabilite                 | -        |
| 9   | next/image migrasyonu         | Performans (LCP/CLS)           | 3-4 saat |
| 10  | Vercel Pro plana geç          | Cron limit, bandwidth          | $20/ay   |
| 11  | Hover debounce ekle           | Gereksiz API çağrıları         | 30 dk    |
| 12  | Component decomposition       | Bakım kolaylığı                | 1-2 gün  |

### Mimari Risk Matrisi

```
Yüksek Etki + Yüksek Olasılık:
├── Ücretsiz AI API kotası tükenmesi (günlük 500K token limit)
├── Rate limit eksikliğinden kötüye kullanım
└── Redis veri kaybı (TTL sonrası geri dönüşüm yok)

Yüksek Etki + Düşük Olasılık:
├── Yahoo Finance API kapanması (piyasa verisi çöker)
├── NewsData.io politika değişikliği
└── Groq ücretsiz tier kaldırması

Düşük Etki + Yüksek Olasılık:
├── Hover cache warming fazla istek üretmesi
├── Büyük componentlerde refactor zorluğu
└── Build hataları (Turbopack parsing sorunları — zaten yaşanmış)
```

---

## 8. Sonuç ve Eylem Planı

### Acı Gerçek

Bu uygulama teknik açıdan **etkileyici bir portfolyo projesi**. AI altyapısı, cache stratejisi, gazete tasarımı — bunlar gerçek mühendislik yetkinliğini gösteriyor. Ama ticari bir ürün olarak **emekleme aşamasında bile değil** — çünkü gelir üretecek hiçbir mekanizma yok.

Güzel bir motor yaptın ama kasaya, direksiyona ve yakıta ihtiyacın var.

### Ne Yapmalısın? (Öncelik sırasıyla)

#### Hafta 1-2: Temel Hijyen
- [ ] Sentry ekle (ücretsiz plan yeterli)
- [ ] API route'lara rate limiting ekle (IP bazlı, 10 req/dk)
- [ ] Admin auth'u JWT'ye çevir
- [ ] Groq/Gemini API kullanım metriklerini logla
- [ ] 10 kritik unit test yaz

#### Hafta 3-4: Hesap ve Ödeme Altyapısı
- [ ] NextAuth.js veya Clerk entegrasyonu (Google + magic link)
- [ ] Kullanıcı verilerini Redis'ten Supabase/PostgreSQL'e taşı
- [ ] Stripe veya Iyzico entegrasyonu
- [ ] Freemium katman sistemi (günlük 5 AI analiz ücretsiz)

#### Hafta 5-6: Gelir Başlangıcı
- [ ] Premium plan lansmanı (aylık 29-49 TL)
- [ ] Google AdSense (ücretsiz katman için)
- [ ] E-posta digest (kullanıcı bağlılığı için)
- [ ] Referral sistemi ("Arkadaşını davet et, 1 hafta premium kazan")

#### Hafta 7-10: B2B Pivot
- [ ] API dökümanlarını yaz (Swagger/OpenAPI)
- [ ] API key sistemi + kullanım dashboard'u
- [ ] B2B fiyatlandırma sayfası
- [ ] 5 potansiyel müşteriye pilot sunumu yap (PR ajansları, haber siteleri)

#### Hafta 11-16: Büyüme
- [ ] White-label embed SDK
- [ ] Medya partnerlikleri
- [ ] TypeScript migrasyonu
- [ ] Tam test suite
- [ ] Veri raporlama ürünü MVP'si

### Son Söz

Bu projenin **teknik temeli sağlam**. AI haber analizi Türkiye'de boş bir niş ve doğru açıyla monetize edilebilir. Ama şu anki haliyle bu bir "güzel demo", ticari ürün değil. 

Yapılması gereken şey basit ama can sıkıcı: test yazma, güvenlik sıkılaştırma, hesap sistemi, ödeme entegrasyonu. Sıkıcı ama gerekli. 

**En büyük hata:** Daha fazla AI özelliği eklemek yerine "nasıl para kazanırım" sorusunu çözmeden ilerlemek. 10 harika AI özelliği 0 kullanıcıdan ödeme alamaz. Şu an ihtiyacın olan şey daha az mühendislik, daha çok iş geliştirme.

---

*Bu rapor, uygulamanın 6 Mart 2026 tarihindeki kaynak kodu incelenerek hazırlanmıştır. Tüm değerlendirmeler kişisel görüş içermez, teknik gerçeklere ve pazar verilerine dayanır.*
