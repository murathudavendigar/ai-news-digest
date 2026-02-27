"use client";

export default function NewsContext({ context }) {
  if (!context) return null;

  return (
    <div className="overflow-hidden border border-indigo-200 rounded-2xl dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-indigo-200 dark:border-indigo-800">
        <span className="flex items-center justify-center text-xs font-bold text-white bg-indigo-600 rounded-full w-7 h-7">
          ⏳
        </span>
        <div>
          <p className="text-sm font-bold leading-none text-indigo-900 dark:text-indigo-100">
            Bağlam Zinciri
          </p>
          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-0.5 uppercase tracking-wider">
            Bu haber neden şimdi çıktı?
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* One liner */}
        {context.oneLiner && (
          <div className="p-4 bg-indigo-100 border border-indigo-200 rounded-xl dark:bg-indigo-900/40 dark:border-indigo-800">
            <p className="text-sm italic font-semibold leading-relaxed text-indigo-900 dark:text-indigo-100">
              &quot;{context.oneLiner}&quot;
            </p>
          </div>
        )}

        {/* Why Now ? */}
        {context.whyNow && (
          <div>
            <p className="mb-2 text-xs font-bold tracking-wider text-indigo-700 uppercase dark:text-indigo-400">
              ⚡ Neden Şimdi?
            </p>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {context.whyNow}
            </p>
          </div>
        )}

        {/* Timeline */}
        {context.timeline?.length > 0 && (
          <div>
            <p className="mb-4 text-xs font-bold tracking-wider text-indigo-700 uppercase dark:text-indigo-400">
              📅 Arka Plan Zinciri
            </p>
            <div className="relative">
              {/* Dikey çizgi */}
              <div className="absolute left-2.75 top-2 bottom-2 w-0.5 bg-indigo-200 dark:bg-indigo-800" />

              <div className="space-y-5">
                {context.timeline.map((item, i) => (
                  <div key={i} className="relative flex items-start gap-4">
                    {/* Nokta */}
                    <div
                      className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center z-10 mt-0.5
                      ${
                        i === context.timeline.length - 1
                          ? "bg-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-800"
                          : "bg-white dark:bg-gray-900 border-2 border-indigo-300 dark:border-indigo-700"
                      }`}>
                      {i === context.timeline.length - 1 && (
                        <span className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <span className="inline-block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                        {item.period}
                      </span>
                      <p className="mb-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                        {item.event}
                      </p>
                      <p className="text-xs italic text-gray-500 dark:text-gray-400">
                        → {item.relevance}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Root Cause */}
        {context.rootCause && (
          <div className="p-4 bg-white border border-indigo-100 rounded-xl dark:bg-gray-800 dark:border-indigo-900">
            <p className="mb-2 text-xs font-bold tracking-wider text-indigo-700 uppercase dark:text-indigo-400">
              🔎 Temel Neden
            </p>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {context.rootCause}
            </p>
          </div>
        )}

        {/* Key Actors */}
        {context.keyActors?.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-bold tracking-wider text-indigo-700 uppercase dark:text-indigo-400">
              👤 Kilit Aktörler
            </p>
            <div className="space-y-2">
              {context.keyActors.map((actor, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-white border border-indigo-100 rounded-xl dark:bg-gray-800 dark:border-indigo-900">
                  <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-900 dark:text-indigo-300 shrink-0">
                    {actor.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {actor.name}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium">
                        {actor.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {actor.interest}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bigger Picture */}
        {context.biggerPicture && (
          <div className="p-4 bg-indigo-100 border border-indigo-200 rounded-xl dark:bg-indigo-900/30 dark:border-indigo-800">
            <p className="mb-2 text-xs font-bold tracking-wider text-indigo-700 uppercase dark:text-indigo-300">
              🌍 Büyük Resim
            </p>
            <p className="text-sm leading-relaxed text-indigo-900 dark:text-indigo-100">
              {context.biggerPicture}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
