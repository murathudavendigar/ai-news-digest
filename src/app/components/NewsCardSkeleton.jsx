/**
 * NewsCardSkeleton — haber kartı yükleme placeholder'ı.
 * NewsCard ile aynı layout: mobilde yatay, desktopda dikey.
 */
export default function NewsCardSkeleton({ index = 0 }) {
  const delay = `${index * 80}ms`;

  return (
    <div
      className="flex md:block overflow-hidden rounded-2xl border
                 bg-white dark:bg-stone-900
                 border-stone-200 dark:border-stone-800">
      {/* Görsel — mobilde sabit, desktopda tam genişlik */}
      <div
        className="w-28 shrink-0 self-stretch md:w-full md:h-48
                   bg-stone-200 dark:bg-stone-800 animate-pulse"
        style={{ animationDelay: delay }}
      />

      {/* İçerik */}
      <div className="flex-1 p-3 md:p-4 flex flex-col justify-between gap-3">
        {/* Kaynak satırı */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse shrink-0"
            style={{ animationDelay: delay }}
          />
          <div
            className="h-2.5 rounded bg-stone-200 dark:bg-stone-700 animate-pulse"
            style={{ width: "35%", animationDelay: delay }}
          />
        </div>

        {/* Başlık — 2 satır */}
        <div className="space-y-1.5">
          <div
            className="h-3.5 rounded bg-stone-200 dark:bg-stone-700 animate-pulse"
            style={{ width: "100%", animationDelay: delay }}
          />
          <div
            className="h-3.5 rounded bg-stone-200 dark:bg-stone-700 animate-pulse"
            style={{ width: "72%", animationDelay: delay }}
          />
        </div>

        {/* Açıklama — sadece desktop, 2 satır */}
        <div className="hidden md:block space-y-1.5">
          <div
            className="h-2.5 rounded bg-stone-100 dark:bg-stone-800 animate-pulse"
            style={{ width: "90%", animationDelay: delay }}
          />
          <div
            className="h-2.5 rounded bg-stone-100 dark:bg-stone-800 animate-pulse"
            style={{ width: "60%", animationDelay: delay }}
          />
        </div>

        {/* Footer satırı */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
          <div
            className="h-2.5 rounded bg-stone-200 dark:bg-stone-700 animate-pulse"
            style={{ width: "28%", animationDelay: delay }}
          />
          <div
            className="h-2.5 rounded bg-stone-200 dark:bg-stone-700 animate-pulse"
            style={{ width: "18%", animationDelay: delay }}
          />
        </div>
      </div>
    </div>
  );
}
