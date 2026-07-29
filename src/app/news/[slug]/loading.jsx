export default function NewsDetailLoading() {
  return (
    <div className="page-shell">
      <div className="page-container-narrow animate-pulse">
        <div className="page-crumb mb-6">
          <div className="h-3 w-14 bg-[var(--bg-elevated)]" />
          <div className="h-3 w-2 bg-[var(--border-subtle)]" />
          <div className="h-3 w-48 bg-[var(--bg-elevated)]" />
        </div>

        <div className="mb-6 h-56 bg-[var(--bg-elevated)] sm:h-72" />

        <div className="page-masthead space-y-3">
          <div className="h-8 w-full bg-[var(--bg-elevated)]" />
          <div className="h-8 w-4/5 bg-[var(--bg-elevated)]" />
          <div className="h-4 w-3/5 bg-[var(--border-subtle)]" />
        </div>

        <div className="mb-8 flex justify-between border-b border-[var(--border-subtle)] pb-5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[var(--bg-elevated)]" />
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-[var(--bg-elevated)]" />
              <div className="h-2.5 w-16 bg-[var(--border-subtle)]" />
            </div>
          </div>
          <div className="h-3 w-28 self-center bg-[var(--border-subtle)]" />
        </div>

        <div className="mb-8 space-y-2">
          {[100, 95, 88, 72].map((w, i) => (
            <div
              key={i}
              className="h-4 bg-[var(--bg-elevated)]"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        <div className="overflow-hidden border border-[var(--border-subtle)]">
          <div className="h-12 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]" />
          <div className="space-y-3 p-5">
            {[100, 92, 85, 70].map((w, i) => (
              <div
                key={i}
                className="h-3 bg-[var(--border-subtle)]"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
