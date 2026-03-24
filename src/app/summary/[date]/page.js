import { supabase } from "@/app/lib/supabase";
import { notFound } from "next/navigation";

// Generate static params for the last 30 days
export async function generateStaticParams() {
  const dates = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push({ date: d.toISOString().slice(0, 10) });
  }
  return dates;
}

export async function generateMetadata({ params }) {
  const { date } = await params;
  return {
    title: `HaberAI Günlük Özet - ${date}`,
    description: `${date} tarihli en önemli yapay zeka seçimi gelişmeleri, haberler ve piyasa verileri.`,
  };
}

export default async function DailyDigestPage({ params }) {
  const { date } = await params;
  
  // Format check (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  const { data: digest, error } = await supabase
    .from("daily_digests")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  if (error || !digest) {
    notFound();
  }

  // Determine if market_data is an object we can iterate over
  const isObjectMarketData = digest.market_data && typeof digest.market_data === 'object' && !Array.isArray(digest.market_data);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Günün Özeti
        </h1>
        <time className="text-xl text-gray-500 dark:text-gray-400">
          {new Date(digest.date).toLocaleDateString("tr-TR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </header>

      <section className="space-y-8">
        {Array.isArray(digest.top_stories) && digest.top_stories.map((story, idx) => (
          <article 
            key={idx} 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                {story.category || "Genel"}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {story.source}
              </span>
            </div>
            
            <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
              <a href={story.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {story.headline}
              </a>
            </h2>
            
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {story.summary}
            </p>
          </article>
        ))}
      </section>

      {digest.market_data && (
        <section className="mt-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <span>📈</span> Piyasa Özeti
          </h3>
          
          {isObjectMarketData ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(digest.market_data).map(([key, value]) => {
                  if (key === 'note') return null; // Skip internal notes
                  const labels = {
                    bist100: "BIST 100",
                    bist100Change: "BIST Değişim",
                    usdTry: "USD/TRY",
                    eurTry: "EUR/TRY",
                    goldGram: "Gram Altın",
                    bitcoin: "Bitcoin"
                  };
                  return (
                    <div key={key} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{labels[key] || key}</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">{value}</div>
                    </div>
                  );
                })}
              </div>
              {digest.market_data.note && (
                <p className="mt-4 text-sm text-gray-500 italic">{digest.market_data.note}</p>
              )}
            </>
          ) : (
            <div className="text-gray-700 dark:text-gray-300">
              <pre className="whitespace-pre-wrap font-sans">
                {typeof digest.market_data === 'string' 
                  ? digest.market_data 
                  : JSON.stringify(digest.market_data, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
