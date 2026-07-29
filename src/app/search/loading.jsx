export default function SearchLoading() {
  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="page-masthead animate-pulse">
          <div className="mb-3 h-2.5 w-24 bg-[var(--bg-elevated)]" />
          <div className="h-8 w-64 max-w-full bg-[var(--bg-elevated)]" />
        </div>
        <div className="mb-6 flex gap-2">
          {[60, 80, 70, 90].map((w, i) => (
            <div
              key={i}
              className="h-7 animate-pulse rounded-full bg-[var(--bg-elevated)]"
              style={{ width: `${w}px`, animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-44 bg-[var(--bg-elevated)]" />
              <div className="space-y-2.5 p-4">
                <div className="h-3.5 w-full bg-[var(--bg-elevated)]" />
                <div className="h-3.5 w-4/5 bg-[var(--bg-elevated)]" />
                <div className="h-3 w-3/4 bg-[var(--border-subtle)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
