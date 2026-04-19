export default function SummaryLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-200">
      {/* Mood bant */}
      <div className="border-b h-7 bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 animate-pulse" />

      <div className="px-6 mx-auto max-w-7xl">
        {/* Masthead */}
        <div className="py-6 space-y-3 text-center border-b-2 border-stone-200 dark:border-stone-700 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div
              className="h-2.5 w-20 bg-stone-200 dark:bg-stone-800 rounded mx-auto"
              style={{ marginLeft: 0 }}
            />
            <div className="flex-1 h-px mx-6 bg-stone-300 dark:bg-stone-700" />
            <div className="h-2.5 w-32 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="flex-1 h-px mx-6 bg-stone-300 dark:bg-stone-700" />
            <div
              className="h-2.5 w-16 bg-stone-200 dark:bg-stone-800 rounded"
              style={{ marginRight: 0 }}
            />
          </div>
          {/* Logo */}
          <div className="h-20 mx-auto rounded md:h-24 w-72 bg-stone-200 dark:bg-stone-800" />
          <div className="w-64 h-3 mx-auto rounded bg-stone-200 dark:bg-stone-800" />
          <div className="h-4 mx-auto rounded w-96 bg-stone-200/60 dark:bg-stone-800/60" />
        </div>

        {/* Nav şeridi */}
        <div className="flex gap-0 border-b border-stone-200 dark:border-stone-700">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="flex-1 h-10 border-r bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-700 animate-pulse"
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>

        {/* Ana manşet grid */}
        <div className="pt-8 pb-6 border-b border-stone-200 dark:border-stone-700">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Sol: Manşet */}
            <div className="space-y-5 lg:col-span-7 lg:border-r lg:border-stone-200 dark:lg:border-stone-700 lg:pr-8 animate-pulse">
              <div className="space-y-3">
                <div className="w-full h-12 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="w-4/5 h-12 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="w-3/5 h-12 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="w-20 h-1 rounded bg-stone-300 dark:bg-stone-700" />
              </div>
              <div className="h-64 rounded bg-stone-200 dark:bg-stone-800" />
              <div className="gap-6 space-y-2 columns-2">
                {[100, 95, 88, 72, 90, 80].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded bg-stone-200 dark:bg-stone-800"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
              <div className="p-5 space-y-3 border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900">
                <div className="w-24 h-4 rounded bg-stone-300 dark:bg-stone-700" />
                <div className="w-full h-5 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="w-4/5 h-5 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="w-full h-3 rounded bg-stone-300 dark:bg-stone-700" />
                <div className="w-5/6 h-3 rounded bg-stone-300 dark:bg-stone-700" />
              </div>
            </div>

            {/* Sağ: Widget'lar */}
            <div className="space-y-0 divide-y lg:col-span-5 divide-stone-200 dark:divide-stone-700 animate-pulse">
              {[0, 1].map((i) => (
                <div key={i} className="flex gap-4 py-5 first:pt-0">
                  <div className="w-10 h-10 rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="flex-1 space-y-2">
                    <div className="w-full h-4 rounded bg-stone-200 dark:bg-stone-800" />
                    <div className="w-4/5 h-4 rounded bg-stone-200 dark:bg-stone-800" />
                    <div className="w-full h-3 rounded bg-stone-300 dark:bg-stone-700" />
                    <div className="w-3/4 h-3 rounded bg-stone-300 dark:bg-stone-700" />
                  </div>
                </div>
              ))}
              {/* Piyasa */}
              <div className="py-5 space-y-3">
                <div className="h-2.5 bg-stone-300 dark:bg-stone-700 rounded w-20" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border rounded h-14 bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                    />
                  ))}
                </div>
              </div>
              {/* Hava */}
              <div className="flex items-center gap-3 py-5">
                <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-800" />
                <div className="space-y-2">
                  <div className="w-24 h-6 rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="w-32 h-3 rounded bg-stone-300 dark:bg-stone-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sayı/kelime/alıntı bandı */}
        <div className="py-6 border-b border-stone-200 dark:border-stone-700 animate-pulse">
          <div className="grid grid-cols-3 divide-x divide-stone-200 dark:divide-stone-700">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-6 space-y-2 first:pl-0 last:pr-0">
                <div className="h-2.5 w-20 bg-stone-300 dark:bg-stone-700 rounded" />
                <div className="h-10 rounded w-28 bg-stone-200 dark:bg-stone-800" />
                <div className="w-40 h-3 rounded bg-stone-300 dark:bg-stone-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Kategoriler grid */}
        <div className="py-8 border-b border-stone-200 dark:border-stone-700 animate-pulse">
          <div className="grid grid-cols-1 gap-0 divide-x md:grid-cols-3 divide-stone-200 dark:divide-stone-700">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-6 space-y-3 first:pl-0 last:pr-0">
                <div className="w-32 h-4 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="w-full h-3 rounded bg-stone-300 dark:bg-stone-700" />
                <div className="w-5/6 h-3 rounded bg-stone-300 dark:bg-stone-700" />
                <div className="w-full h-3 rounded bg-stone-300 dark:bg-stone-700" />
                <div className="space-y-1.5 mt-2">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="h-2.5 bg-stone-200 dark:bg-stone-800 rounded"
                      style={{ width: `${85 - j * 10}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gazete altı */}
        <div className="py-8 text-center animate-pulse">
          <div className="relative px-10">
            <div className="h-20 max-w-xl mx-auto rounded bg-stone-200/40 dark:bg-stone-800/40" />
          </div>
          <div className="h-2.5 w-20 bg-stone-300 dark:bg-stone-700 rounded mx-auto mt-8" />
        </div>
      </div>
    </div>
  );
}
