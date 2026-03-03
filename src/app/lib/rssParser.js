// lib/rssParser.js
// RSS/Atom XML parser — harici paket yok, native fetch

const FETCH_TIMEOUT_MS = 8000;

// ── XML yardımcıları ─────────────────────────────────────────────────────

function extractTag(xml, tag) {
  // CDATA
  const cdataRe = new RegExp(
    "<" + tag + "[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/" + tag + ">",
    "i",
  );
  const cdata = xml.match(cdataRe);
  if (cdata) return cdata[1].trim();
  // Normal
  const normalRe = new RegExp(
    "<" + tag + "[^>]*>([\\s\\S]*?)<\\/" + tag + ">",
    "i",
  );
  const normal = xml.match(normalRe);
  if (normal) return normal[1].replace(/<[^>]+>/g, "").trim();
  return null;
}

function extractAttr(xml, tag, attr) {
  const re = new RegExp(
    "<" + tag + "[^>]*\\s" + attr + "=[\"']([^\"']*)[\"']",
    "i",
  );
  const m = xml.match(re);
  return m ? m[1] : null;
}

function extractAll(xml, tag) {
  const re = new RegExp("<" + tag + "[\\s>][\\s\\S]*?<\\/" + tag + ">", "gi");
  return xml.match(re) || [];
}

function decodeHtmlEntities(str) {
  return (
    str
      // Önce &amp; çözülmeli (diğer entity'lere karışmasın)
      .replace(/&amp;/g, "&")
      // Named entities
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&laquo;/g, "«")
      .replace(/&raquo;/g, "»")
      // Tüm &#x…; (hex) ve &#…; (decimal) numeric entity'leri çöz
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
        String.fromCodePoint(parseInt(hex, 16)),
      )
      .replace(/&#([0-9]+);/g, (_, dec) =>
        String.fromCodePoint(parseInt(dec, 10)),
      )
  );
}

function cleanHtml(str) {
  if (!str) return null;
  return decodeHtmlEntities(str)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000); // description için genişletildi (AI analizi için yeterli bağlam)
}

function extractImage(itemXml) {
  // 1. media:content url=
  let m = itemXml.match(/media:content[^>]*url=["']([^"']+)["']/i);
  if (m) return m[1];
  // 2. enclosure image
  m = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i);
  if (m) return m[1];
  // 3. <img src=
  m = itemXml.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (m && !m[1].includes("pixel") && !m[1].includes("1x1")) return m[1];
  return null;
}

function extractFullContent(itemXml) {
  // content:encoded CDATA
  const cdataRe =
    /<content:encoded[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i;
  const cdata = itemXml.match(cdataRe);
  if (cdata) {
    const text = cleanHtml(cdata[1]);
    if (text && text.length > 100) return text.slice(0, 8000);
  }
  // content:encoded normal
  const normalRe = /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i;
  const normal = itemXml.match(normalRe);
  if (normal) {
    const text = cleanHtml(normal[1]);
    if (text && text.length > 100) return text.slice(0, 8000);
  }
  return null;
}

function parseDate(str) {
  if (!str) return new Date().toISOString();
  try {
    return new Date(str).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function slugId(sourceId, title, pubDate) {
  const base =
    sourceId +
    "-" +
    (title || "").slice(0, 40) +
    "-" +
    (pubDate || "").slice(0, 10);
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Tek kaynak fetch ─────────────────────────────────────────────────────

export async function fetchRSS(source) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "HaberAI RSS Reader/1.0 (+https://haberai.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error("HTTP " + res.status);
    const xml = await res.text();
    return parseRSSXML(xml, source);
  } catch (err) {
    // priority 3 kaynaklar sessiz fail — log kirliliği önle
    const verbose = (source.priority || 1) <= 2;
    if (verbose) {
      if (err.name === "AbortError") {
        console.warn("[rss] Timeout:", source.name);
      } else {
        console.warn("[rss] Hata " + source.name + ":", err.message);
      }
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function parseRSSXML(xml, source) {
  // RSS <item> veya Atom <entry>
  let items = extractAll(xml, "item");
  if (items.length === 0) items = extractAll(xml, "entry");

  const articles = [];

  for (const item of items.slice(0, 30)) {
    const title = cleanHtml(extractTag(item, "title"));
    if (!title) continue;

    const link = extractTag(item, "link") || extractAttr(item, "link", "href");
    const description = cleanHtml(
      extractTag(item, "description") || extractTag(item, "summary"),
    );
    const fullContent = extractFullContent(item);
    const pubDate =
      extractTag(item, "pubDate") ||
      extractTag(item, "published") ||
      extractTag(item, "updated");
    const imageUrl = extractImage(item);
    const author = cleanHtml(
      extractTag(item, "author") || extractTag(item, "dc:creator"),
    );

    articles.push({
      article_id: slugId(source.id, title, pubDate),
      title,
      description: fullContent || description || "",
      content: fullContent || null,
      link: link || null,
      source_name: source.name,
      source_id: source.id,
      source_icon: source.icon || null, // rssSources.js'ten gelen favicon URL
      image_url: imageUrl || null,
      pubDate: parseDate(pubDate),
      creator: author ? [author] : [],
      category: source.categories,
      language: source.lang,
      _fromRSS: true,
      _hasFullContent: !!fullContent,
    });
  }

  return articles;
}

// ── Çoklu kaynak — throttled paralel ─────────────────────────────────────

export async function fetchMultipleRSS(sources, { maxConcurrent = 5 } = {}) {
  const all = [];

  for (let i = 0; i < sources.length; i += maxConcurrent) {
    const batch = sources.slice(i, i + maxConcurrent);
    const results = await Promise.all(batch.map((s) => fetchRSS(s)));
    all.push(...results.flat());
  }

  // Başlık benzerliğiyle deduplicate
  const seen = new Set();
  const unique = [];
  for (const a of all) {
    const key = a.title.toLowerCase().slice(0, 60);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(a);
    }
  }

  // En yeni önce
  return unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}
