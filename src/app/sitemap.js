import { siteConfig, CATEGORIES } from "@/app/lib/siteConfig";
import { supabase } from "@/app/lib/supabase";
import { redis } from "@/app/lib/redis";
import { normalizeArticle } from "@/app/lib/newsUtils";

const SITE_URL = siteConfig.url;

export default async function sitemap() {
  const now = new Date().toISOString();

  const staticRoutes = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/digest`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/columns`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.3,
    },
  ];

  const categoryRoutes = CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/category/${cat.slug}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  // Columnists
  let columnistRoutes = [];
  let columnRoutes = [];
  try {
    const { data: columnists } = await supabase
      .from("columnists")
      .select("slug, updated_at")
      .eq("is_active", true);
    columnistRoutes = (columnists || []).map((c) => ({
      url: `${SITE_URL}/columns/${c.slug}`,
      lastModified: c.updated_at
        ? new Date(c.updated_at).toISOString()
        : now,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    const { data: columns } = await supabase
      .from("columns")
      .select("slug, published_at, columnist:columnist_id(slug)")
      .order("published_at", { ascending: false })
      .limit(1000);

    columnRoutes = (columns || []).map((col) => {
      const pubDate = new Date(col.published_at);
      return {
        url: `${SITE_URL}/columns/${col.columnist?.slug}/${col.slug}`,
        lastModified: isNaN(pubDate.getTime()) ? now : pubDate.toISOString(),
        changeFrequency: "weekly",
        priority: 0.65,
      };
    });
  } catch {
    // Supabase yoksa sitemap yine de temel rotaları döner
  }

  // Güncel haberler (Redis feed önbelleği)
  let newsRoutes = [];
  try {
    const feed = await redis.get("rss:feed:all:full:v2");
    const results = feed?.results || [];
    const seen = new Set();
    for (const raw of results.slice(0, 80)) {
      const a = normalizeArticle(raw);
      if (!a?.slug || seen.has(a.slug)) continue;
      seen.add(a.slug);
      const lm = a.pubDate || a.publishedAt;
      newsRoutes.push({
        url: `${SITE_URL}/news/${a.slug}`,
        lastModified: lm ? new Date(lm).toISOString() : now,
        changeFrequency: "hourly",
        priority: 0.7,
      });
    }
  } catch {
    // Redis yoksa haber URL'leri atlanır
  }

  // Son 14 günün günlük özet sayfaları
  const digestRoutes = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    digestRoutes.push({
      url: `${SITE_URL}/digest/${dateStr}`,
      lastModified: d.toISOString(),
      changeFrequency: "weekly",
      priority: i === 0 ? 0.9 : 0.6,
    });
  }

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...columnistRoutes,
    ...columnRoutes,
    ...newsRoutes,
    ...digestRoutes,
  ];
}
