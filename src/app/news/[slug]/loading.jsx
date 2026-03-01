
export default function NewsDetailLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl px-4 py-8 mx-auto sm:px-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6 animate-pulse">
          <div className="h-3 rounded w-14 bg-stone-200 dark:bg-stone-700" />
          <div className="w-2 h-3 rounded bg-stone-100 dark:bg-stone-800" />
          <div className="w-48 h-3 rounded bg-stone-200 dark:bg-stone-700" />
        </div>

        <div className="overflow-hidden bg-white shadow-xl dark:bg-stone-900 rounded-2xl animate-pulse">
          {/* Görsel */}
          <div className="h-72 bg-stone-200 dark:bg-stone-700" />

          <div className="p-6 space-y-6 md:p-8">
            {/* Başlık */}
            <div className="space-y-3">
              <div className="w-full h-8 rounded bg-stone-200 dark:bg-stone-700" />
              <div className="w-4/5 h-8 rounded bg-stone-200 dark:bg-stone-700" />
              <div className="w-3/5 h-6 rounded bg-stone-100 dark:bg-stone-800" />
            </div>

            {/* Meta */}
            <div className="flex justify-between pb-5 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700" />
                <div className="space-y-1.5">
                  <div className="w-24 h-3 rounded bg-stone-200 dark:bg-stone-700" />
                  <div className="h-2.5 w-16 bg-stone-100 dark:bg-stone-800 rounded" />
                </div>
              </div>
              <div className="self-center w-32 h-3 rounded bg-stone-100 dark:bg-stone-800" />
            </div>

            {/* Badges */}
            <div className="flex gap-2">
              {[60, 72, 48].map((w) => (
                <div
                  key={w}
                  className={`h-6 bg-stone-100 dark:bg-stone-800 rounded-md w-${w < 65 ? 16 : w < 75 ? 20 : 12}`}
                />
              ))}
            </div>

            {/* Açıklama */}
            <div className="pb-6 space-y-2 border-b border-stone-100 dark:border-stone-800">
              {[100, 95, 88, 72].map((w, i) => (
                <div
                  key={i}
                  className="h-4 rounded bg-stone-100 dark:bg-stone-800"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>

            {/* AI Özet kutusu */}
            <div className="overflow-hidden border rounded-2xl border-stone-200 dark:border-stone-700">
              <div className="h-12 border-b bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700" />
              <div className="p-5 space-y-3">
                {[100, 92, 85, 70].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded bg-stone-100 dark:bg-stone-800"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Analiz kutusu */}
            <div className="overflow-hidden border rounded-2xl border-stone-200 dark:border-stone-700">
              <div className="h-12 border-b bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700" />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-5">
                  <div className="w-24 h-24 rounded-full bg-stone-200 dark:bg-stone-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    {[100, 88, 76].map((w, i) => (
                      <div
                        key={i}
                        className="h-3 rounded bg-stone-100 dark:bg-stone-800"
                        style={{ width: `${w}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-2.5 w-20 bg-stone-100 dark:bg-stone-800 rounded shrink-0" />
                      <div className="flex-1 h-1.5 bg-stone-100 dark:bg-stone-800 rounded" />
                      <div className="h-2.5 w-5 bg-stone-100 dark:bg-stone-800 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
