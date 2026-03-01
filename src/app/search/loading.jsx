export default function SearchLoading() {
  return (
    <div className="min-h-screen">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6">
        <div className="pb-6 mb-8 border-b border-stone-200 dark:border-stone-700 animate-pulse">
          <div className="h-2.5 w-24 bg-stone-200 dark:bg-stone-700 rounded mb-3" />
          <div className="w-64 h-8 rounded bg-stone-200 dark:bg-stone-700" />
        </div>
        <div className="flex gap-2 mb-6">
          {[60, 80, 70, 90].map((w, i) => (
            <div
              key={i}
              className="rounded-full h-7 bg-stone-100 dark:bg-stone-800 animate-pulse"
              style={{ width: `${w}px`, animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="overflow-hidden bg-white border dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-2xl animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className="h-44 bg-stone-100 dark:bg-stone-800" />
              <div className="p-4 space-y-2.5">
                <div className="h-3.5 bg-stone-200 dark:bg-stone-700 rounded w-full" />
                <div className="h-3.5 bg-stone-200 dark:bg-stone-700 rounded w-4/5" />
                <div className="w-3/4 h-3 rounded bg-stone-100 dark:bg-stone-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
