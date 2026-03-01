
export default function CategoryLoading() {
  return (
    <div className="min-h-screen">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-3 rounded w-14 bg-stone-200 dark:bg-stone-700 animate-pulse" />
          <div className="w-2 h-3 rounded bg-stone-100 dark:bg-stone-800 animate-pulse" />
          <div className="w-20 h-3 rounded bg-stone-200 dark:bg-stone-700 animate-pulse" />
        </div>

        {/* Header skeleton */}
        <div className="pb-6 mb-8 border-b border-stone-200 dark:border-stone-700 animate-pulse">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-stone-200 dark:bg-stone-700 rounded-xl" />
            <div className="space-y-2">
              <div className="w-40 h-8 rounded bg-stone-200 dark:bg-stone-700" />
              <div className="w-64 h-3 rounded bg-stone-100 dark:bg-stone-800" />
            </div>
          </div>
          <div className="w-24 h-6 mt-4 rounded-full bg-stone-100 dark:bg-stone-800" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="overflow-hidden bg-white border dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-2xl animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}>
              <div className="h-48 bg-stone-100 dark:bg-stone-800" />
              <div className="p-4 space-y-2.5">
                <div className="h-3.5 bg-stone-200 dark:bg-stone-700 rounded w-full" />
                <div className="h-3.5 bg-stone-200 dark:bg-stone-700 rounded w-4/5" />
                <div className="w-3/4 h-3 rounded bg-stone-100 dark:bg-stone-800" />
                <div className="flex justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="h-2.5 bg-stone-100 dark:bg-stone-800 rounded w-16" />
                  <div className="h-2.5 bg-stone-100 dark:bg-stone-800 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
