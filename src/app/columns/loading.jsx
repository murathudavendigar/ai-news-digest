export default function ColumnsLoading() {
  return (
    <div className="page-shell">
      <div className="page-container-narrow animate-pulse">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-3 w-14 bg-[var(--bg-elevated)]" />
          <div className="h-3 w-2 bg-[var(--border-subtle)]" />
          <div className="h-3 w-28 bg-[var(--bg-elevated)]" />
        </div>
        <div className="page-masthead">
          <div className="mb-3 h-2 w-20 bg-[var(--bg-elevated)]" />
          <div className="mb-3 h-10 w-full max-w-md bg-[var(--bg-elevated)]" />
          <div className="h-4 w-2/3 max-w-sm bg-[var(--border-subtle)]" />
        </div>
        <div className="space-y-3">
          {[100, 96, 92, 88, 84, 90, 78, 85].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded bg-[var(--bg-elevated)]"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
