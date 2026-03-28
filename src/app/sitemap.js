import { siteConfig } from "@/app/lib/siteConfig";
import { supabase } from "@/app/lib/supabase";

const SITE_URL = siteConfig.url;

const CATEGORY_SLUGS = [
  "technology",
  "sports",
  "business",
  "health",
  "entertainment",
  "politics",
  "world",
];

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
      url: `${SITE_URL}/summary`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/saved`,
      lastModified: now,
      changeFrequency: "never",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: now,
      changeFrequency: "never",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/columns`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    }
  ];

  const categoryRoutes = CATEGORY_SLUGS.map((slug) => ({
    url: `${SITE_URL}/category/${slug}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  // Columnists
  const { data: columnists } = await supabase.from('columnists').select('slug, updated_at').eq('is_active', true);
  const columnistRoutes = (columnists || []).map((c) => ({
    url: `${SITE_URL}/columns/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at).toISOString() : now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // Columns
  const { data: columns } = await supabase
    .from('columns')
    .select('slug, published_at, columnist:columnist_id(slug)')
    .order('published_at', { ascending: false })
    .limit(1000);

  const columnRoutes = (columns || []).map((col) => {
    const pubDate = new Date(col.published_at);
    return {
      url: `${SITE_URL}/columns/${col.columnist?.slug}/${col.slug}`,
      lastModified: isNaN(pubDate) ? now : pubDate.toISOString(),
      changeFrequency: "weekly",
      priority: 0.6,
    };
  });

  return [...staticRoutes, ...categoryRoutes, ...columnistRoutes, ...columnRoutes];
}
