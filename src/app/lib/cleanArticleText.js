/**
 * Haber metninden site CTA / Google follow / bülten gürültüsünü temizler.
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
];

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
  if (/^(paylaş|abone ol|kaynak ekle)\.?$/i.test(lower)) return true;
  // Çoğunlukla CTA: çok az noktalama + kısa
  const letters = (t.match(/[a-zA-ZçğıöşüÇĞİÖŞÜ]/g) || []).length;
  if (letters > 0 && t.length < 60 && !/[.!?…]/.test(t)) {
    if (/takip|google|abone|paylaş|devamı|kaynak/i.test(lower)) return true;
  }
  return false;
}

/**
 * Ham haber metninden promo bloklarını çıkar, yapışık cümleleri ayır.
 */
export function scrubPromoNoise(text) {
  if (!text) return "";
  let t = String(text);

  for (const re of PROMO_REGEXES) {
    t = t.replace(re, " ");
  }

  // Yapışık cümle: "...ekleyinMasterChef" veya ".MasterChef"
  // Marka CamelCase (MasterChef) bozulmasın diye yalnızca Türkçe bitiş / nokta sonrası
  t = t.replace(
    /(ekleyin|edin|olun|tıklayın|okuyun|devamı|devami)([A-ZÇĞİÖŞÜ])/gi,
    "$1 $2",
  );
  t = t.replace(/([.!?…])([A-ZÇĞİÖŞÜ])/g, "$1 $2");

  // Başta kalan okuma CTA'sı
  t = t.replace(/^\s*haberin\s*devam[ıi]\s*/i, "");

  // Fazla boşluk / boş satırlar
  t = t
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return t;
}

/**
 * Paragraf listesine çevirirken junk satırları at.
 */
export function toCleanParagraphs(bodyText) {
  if (!bodyText) return [];
  const scrubbed = scrubPromoNoise(bodyText);
  return scrubbed
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}|\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 40 && !isJunkParagraph(p));
}
