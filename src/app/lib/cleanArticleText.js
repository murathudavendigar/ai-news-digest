/**
 * Haber metninden site CTA / reklam / yazar bio / ilgili haber gürültüsünü temizler.
 * RSS description + reader scrape ortak kullanır.
 */

const PROMO_REGEXES = [
  // Google Preferred Source / Follow widgets (TR + EN)
  /h?aberlerimizi\s*google['’`]?da\s*takip\s*edin/gi,
  /gelişmelerden\s*anında\s*haberdar\s*olun\.?/gi,
  /google['’`]?da\s*tercih\s*edilen\s*kaynak\s*olarak\s*ekleyin/gi,
  /google['’`]?da\s*tercih\s*edilenkaynak\s*olarak\s*ekleyin/gi,
  /google['’`]?da\s*tercih\s*edilen\s*kayna[gğ]\s*olarak\s*ekleyin/gi,
  /follow\s+(us\s+)?on\s+google\.?/gi,
  /add\s+(us\s+)?as\s+a?\s*preferred\s+source\.?/gi,
  /preferred\s+source\s+on\s+google/gi,
  // Read-more / paywall chrome glued into body
  /haberin\s*devam[ıi]/gi,
  /yazının\s*devam[ıi]/gi,
  /devamını\s*(okumak\s*için\s*)?(tıklayın|okuyun)\.?/gi,
  // Newsletter / cookie / KVKK blurbs
  /e-?\s*bülten(e)?\s*(abone|kayıt).{0,40}/gi,
  /çerez\s*(politikası|ayarı|tercih).{0,30}/gi,
  /kvkk\s*aydınlatma\s*metni.{0,40}/gi,
  /kişisel\s*verilerin\s*korunması.{0,40}/gi,
  // Social share leftovers
  /facebook['’`]?ta\s*paylaş/gi,
  /twitter['’`]?da\s*paylaş/gi,
  /whatsapp['’`]?ta\s*paylaş/gi,
  /bu\s*haberi\s*paylaş/gi,
  // Inline ad markers (Onedio vb.)
  /\breklam\b/gi,
  /\badvertisement\b/gi,
  /\bsponsored\b/gi,
];

/** Yazar bio / editör kutusu başlangıçları */
const BIO_START_RE =
  /^(merve|ahmet|ayşe|mehmet|can|elif|deniz|burak|selin|emre|zeynep|fatma|ali|mustafa)\s+[A-ZÇĞİÖŞÜa-zçğıöşü]+\s+(TV\s+)?(Editörü|Editör|Yazar|Muhabir|Köşe\s*yazarı)/i;

const BIO_SIGNAL_RE =
  /(bünyesinde|yüksek\s*lisans|mezun\s*olduktan|editörü\s*olarak\s*çalışıyorum|metin\s*yazarlığı|soru\s*yazarlığı|çocukluğumda\s*başlayan|tüm\s*içerikleri)/i;

/** İlgili haber / oyun CTA satırları */
const RELATED_HEADLINE_RE =
  /^(bu\s*kez|sevdiğim|ted\s*lasso|fragman[ıi]|setinden\s*ilk|yerli\s*film|emoji|tahmin\s*etme|okumanızı\s*öneririz|ilginizi\s*çekebilir|bunlar\s*da\s*ilginizi)/i;

/** Tek paragraf / satır tamamen çöp mü? */
export function isJunkParagraph(text) {
  const t = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return true;
  if (t.length < 30) return true;

  const lower = t.toLowerCase();
  if (/google.?da.*(takip|tercih|kaynak)/i.test(lower)) return true;
  if (/preferred\s+source/i.test(lower)) return true;
  if (/^haberin\s*devamı\.?$/i.test(lower)) return true;
  if (/haberdar olun/i.test(lower) && t.length < 100) return true;
  if (/^(paylaş|abone ol|kaynak ekle|reklam)\.?$/i.test(lower)) return true;
  if (/^reklam\b/i.test(t) && t.length < 80) return true;
  if (BIO_START_RE.test(t)) return true;
  if (BIO_SIGNAL_RE.test(t) && t.length < 900) return true;
  if (RELATED_HEADLINE_RE.test(t) && t.length < 160) return true;
  // Başlık benzeri: kısa, noktasız, Title Case yoğun
  if (t.length < 120 && !/[.!?…]/.test(t) && /[A-ZÇĞİÖŞÜ].*[A-ZÇĞİÖŞÜ]/.test(t)) {
    if (/fragman|dizisinin|sezon|paylaştı|yalanlandı|iddiası/i.test(t)) {
      // tek başına ilgili-haber başlığı olabilir
      const words = t.split(/\s+/).length;
      if (words >= 6 && words <= 18) return true;
    }
  }
  // Çoğunlukla CTA: çok az noktalama + kısa
  const letters = (t.match(/[a-zA-ZçğıöşüÇĞİÖŞÜ]/g) || []).length;
  if (letters > 0 && t.length < 60 && !/[.!?…]/.test(t)) {
    if (/takip|google|abone|paylaş|devamı|kaynak|reklam/i.test(lower))
      return true;
  }
  return false;
}

/**
 * Breadcrumb: "Haberler Dizi & Film {Title}" başını kırp.
 */
function stripBreadcrumbPrefix(text, title) {
  let t = text;
  // İlk satırda breadcrumb + tekrarlayan başlık
  const lines = t.split(/\n/);
  if (lines.length > 1) {
    const first = lines[0].trim();
    if (
      /^(haberler|anasayfa|ana\s*sayfa|magazin|dizi)/i.test(first) ||
      (title && first.includes(title.slice(0, 40)))
    ) {
      // İlk satır çoğunlukla nav+title — at
      if (first.length < title?.length + 80 || /haberler/i.test(first)) {
        lines.shift();
        t = lines.join("\n").trim();
      }
    }
  }
  t = t.replace(
    /^(haberler|anasayfa|ana\s*sayfa|güncel|magazin|dizi\s*&\s*film|sinema|spor|ekonomi|dünya|teknoloji)(\s*[›>/\-|·•]\s*|\s+){1,6}/i,
    "",
  );
  if (title && title.length > 20) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^\\s*${escaped}\\s*`, "i");
    t = t.replace(re, "");
  }
  return t.trim();
}

/**
 * "Reklam Türkiye" → "Türkiye" gibi yapışık reklam artığını düzelt.
 */
function fixGluedAdGaps(text) {
  return String(text)
    .replace(/\breklam\s+/gi, " ")
    // "Reklam" silinince kalan "ürkiye'de" → Türkiye
    .replace(/(^|[.!?…]\s+|[\n])ürkiye\b/gi, "$1Türkiye")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.!;:])/g, "$1");
}

/**
 * Yazar bio ve "ilgili haber" kuyruğunu kes — genelde yazının son %40'ında.
 */
function trimTrailingChrome(text) {
  const paras = text
    .split(/\n{2,}|\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (paras.length < 3) return text;

  let cut = paras.length;
  for (let i = 0; i < paras.length; i++) {
    const p = paras[i];
    if (BIO_START_RE.test(p) || (BIO_SIGNAL_RE.test(p) && i >= 2)) {
      cut = i;
      break;
    }
    // Ardışık kısa "ilgili haber" başlıkları
    if (
      i >= 2 &&
      RELATED_HEADLINE_RE.test(p) &&
      p.length < 140 &&
      !/[.!?…]/.test(p)
    ) {
      cut = i;
      break;
    }
  }

  // Sondan gelen junk kuyruğunu budamak için geriye doğru da bak
  while (cut > 2 && isJunkParagraph(paras[cut - 1])) {
    cut -= 1;
  }

  return paras.slice(0, cut).join("\n\n");
}

/**
 * Ham haber metninden promo / reklam / chrome bloklarını çıkar.
 */
export function scrubPromoNoise(text, { title } = {}) {
  if (!text) return "";
  let t = String(text);

  t = stripBreadcrumbPrefix(t, title);

  for (const re of PROMO_REGEXES) {
    t = t.replace(re, " ");
  }

  t = fixGluedAdGaps(t);

  // Yapışık cümle: "...ekleyinMasterChef"
  t = t.replace(
    /(ekleyin|edin|olun|tıklayın|okuyun|devamı|devami)([A-ZÇĞİÖŞÜ])/gi,
    "$1 $2",
  );
  t = t.replace(/([.!?…])([A-ZÇĞİÖŞÜ])/g, "$1 $2");
  t = t.replace(/^\s*haberin\s*devam[ıi]\s*/i, "");

  t = trimTrailingChrome(t);

  t = t
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return t;
}

/**
 * AI temizliği gerekli mi? (reklam, bio, ilgili haber sinyalleri)
 */
export function needsAiBodyCleanup(text) {
  const t = String(text || "");
  if (t.length < 280) return false;
  const lower = t.toLowerCase();
  let score = 0;
  if (/\breklam\b/i.test(t)) score += 2;
  if (BIO_SIGNAL_RE.test(t) || BIO_START_RE.test(t)) score += 2;
  if (/bu\s*kez\s+sinefilleri|emojilerden|setinden\s*ilk\s*kare/i.test(t))
    score += 2;
  if (/haberler\s+(dizi|magazin|spor|ekonomi)/i.test(lower.slice(0, 120)))
    score += 1;
  // Birden fazla Title-Case kısa satır = ilgili haber ızgarası
  const shortHeadlines = t
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 40 && l.length < 120 && !/[.!?…]/.test(l));
  if (shortHeadlines.length >= 3) score += 2;
  return score >= 2;
}

/**
 * Paragraf listesine çevirirken junk satırları at.
 */
export function toCleanParagraphs(bodyText, { title } = {}) {
  if (!bodyText) return [];
  const scrubbed = scrubPromoNoise(bodyText, { title });
  return scrubbed
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}|\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 40 && !isJunkParagraph(p));
}
