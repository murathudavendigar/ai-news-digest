
export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6">
        {/* DailySummary skeleton */}
        <div
          className="mb-10 overflow-hidden bg-white border rounded-2xl border-stone-200 dark:border-stone-700 dark:bg-stone-900 animate-pulse">
          <div className="pb-5 space-y-3 border-b px-7 pt-7 border-stone-100 dark:border-stone-800">
            <div className="w-1/4 h-3 rounded bg-stone-100 dark:bg-stone-800" />
            <div className="w-3/4 h-8 rounded bg-stone-200 dark:bg-stone-700" />
            <div className="w-1/2 h-4 rounded bg-stone-100 dark:bg-stone-800" />
            <div className="pt-2 space-y-2">
              <div className="w-full h-3 rounded bg-stone-100 dark:bg-stone-800" />
              <div className="w-5/6 h-3 rounded bg-stone-100 dark:bg-stone-800" />
            </div>
          </div>
          {/* Mustread skeleton */}
          <div className="py-5 space-y-4 border-b px-7 border-stone-100 dark:border-stone-800">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-3 rounded bg-stone-200 dark:bg-stone-700" />
                  <div className="w-full h-3 rounded bg-stone-100 dark:bg-stone-800" />
                </div>
              </div>
            ))}
          </div>
          {/* Bölümler skeleton */}
          <div className="grid grid-cols-2 divide-x divide-stone-100 dark:divide-stone-800">
            {[1, 2].map((i) => (
              <div key={i} className="px-6 py-5 space-y-2">
                <div className="w-1/3 h-3 rounded bg-stone-100 dark:bg-stone-800" />
                <div className="w-2/3 h-3 rounded bg-stone-200 dark:bg-stone-700" />
                <div className="w-full h-3 rounded bg-stone-100 dark:bg-stone-800" />
                <div className="w-5/6 h-3 rounded bg-stone-100 dark:bg-stone-800" />
              </div>
            ))}
          </div>
        </div>

        {/* News grid skeleton */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="overflow-hidden bg-white border dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-2xl animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}>
              {/* Görsel */}
              <div className="h-48 bg-stone-100 dark:bg-stone-800" />
              {/* İçerik */}
              <div className="p-4 space-y-2.5">
                <div className="h-3.5 bg-stone-200 dark:bg-stone-700 rounded w-full" />
                <div className="h-3.5 bg-stone-200 dark:bg-stone-700 rounded w-4/5" />
                <div className="w-full h-3 rounded bg-stone-100 dark:bg-stone-800" />
                <div className="w-3/4 h-3 rounded bg-stone-100 dark:bg-stone-800" />
                <div className="flex justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="h-2.5 bg-stone-100 dark:bg-stone-800 rounded w-20" />
                  <div className="h-2.5 bg-stone-100 dark:bg-stone-800 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
