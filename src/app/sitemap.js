import { siteConfig } from "@/app/lib/siteConfig";

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

export default function sitemap() {
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
  ];

  const categoryRoutes = CATEGORY_SLUGS.map((slug) => ({
    url: `${SITE_URL}/category/${slug}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes];
}
