export default function Loading() {
  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="mb-10 animate-pulse overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="space-y-3 border-b border-[var(--border-subtle)] px-7 pb-5 pt-7">
            <div className="h-3 w-1/4 bg-[var(--bg-elevated)]" />
            <div className="h-8 w-3/4 bg-[var(--bg-elevated)]" />
            <div className="h-4 w-1/2 bg-[var(--border-subtle)]" />
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-[var(--bg-elevated)]" />
              <div className="h-3 w-5/6 bg-[var(--bg-elevated)]" />
            </div>
          </div>
          <div className="space-y-4 border-b border-[var(--border-subtle)] px-7 py-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-8 shrink-0 bg-[var(--bg-elevated)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-[var(--bg-elevated)]" />
                  <div className="h-3 w-full bg-[var(--border-subtle)]" />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 divide-x divide-[var(--border-subtle)]">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2 px-6 py-5">
                <div className="h-3 w-1/3 bg-[var(--bg-elevated)]" />
                <div className="h-3 w-2/3 bg-[var(--bg-elevated)]" />
                <div className="h-3 w-full bg-[var(--border-subtle)]" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-48 bg-[var(--bg-elevated)]" />
              <div className="space-y-2.5 p-4">
                <div className="h-3.5 w-full bg-[var(--bg-elevated)]" />
                <div className="h-3.5 w-4/5 bg-[var(--bg-elevated)]" />
                <div className="h-3 w-full bg-[var(--border-subtle)]" />
                <div className="h-3 w-3/4 bg-[var(--border-subtle)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
