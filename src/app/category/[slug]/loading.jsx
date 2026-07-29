export default function CategoryLoading() {
  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-3 w-14 animate-pulse bg-[var(--bg-elevated)]" />
          <div className="h-3 w-2 animate-pulse bg-[var(--border-subtle)]" />
          <div className="h-3 w-20 animate-pulse bg-[var(--bg-elevated)]" />
        </div>

        <div className="page-masthead animate-pulse">
          <div className="mb-3 h-2 w-16 bg-[var(--bg-elevated)]" />
          <div className="mb-3 h-10 w-48 bg-[var(--bg-elevated)]" />
          <div className="h-4 w-72 max-w-full bg-[var(--border-subtle)]" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] animate-pulse"
            >
              <div className="h-40 bg-[var(--bg-elevated)]" />
              <div className="space-y-2.5 p-4">
                <div className="h-3.5 w-full rounded bg-[var(--bg-elevated)]" />
                <div className="h-3.5 w-4/5 rounded bg-[var(--bg-elevated)]" />
                <div className="h-3 w-3/4 rounded bg-[var(--border-subtle)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
