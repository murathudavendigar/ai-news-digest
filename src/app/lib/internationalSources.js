// Named export — follows authorConfig/cityConfig pattern
export const INTERNATIONAL_SOURCES = [
  {
    id: "reuters",
    name: "Reuters",
    language: "en",
    rssUrl: "https://feeds.reuters.com/reuters/topNews",
    fallbackUrl: "https://rss.reuters.com/news/topNews",
    category: "world",
    priority: 1,
  },
  {
    id: "ap",
    name: "AP News",
    language: "en",
    rssUrl: "https://feeds.apnews.com/rss/apf-topnews",
    category: "world",
    priority: 1,
  },
  {
    id: "bbc-world",
    name: "BBC Dünya",
    language: "en",
    rssUrl: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "world",
    priority: 2,
  },
  {
    id: "bloomberg",
    name: "Bloomberg",
    language: "en",
    rssUrl: "https://feeds.bloomberg.com/markets/news.rss",
    category: "business",
    priority: 2,
  },
  {
    id: "guardian",
    name: "The Guardian",
    language: "en",
    rssUrl: "https://www.theguardian.com/world/rss",
    category: "world",
    priority: 3,
  },
  {
    id: "dw-turkce",
    name: "DW Türkçe",
    language: "tr", // already Turkish — no translation needed
    rssUrl: "https://rss.dw.com/rdf/rss-tur-all",
    category: "world",
    priority: 1,
    noTranslation: true, // skip Gemini translation
  },
];

export const SOURCES_NEEDING_TRANSLATION = INTERNATIONAL_SOURCES.filter(
  (s) => !s.noTranslation,
);

export const SOURCES_ALREADY_TURKISH = INTERNATIONAL_SOURCES.filter(
  (s) => s.noTranslation,
);
