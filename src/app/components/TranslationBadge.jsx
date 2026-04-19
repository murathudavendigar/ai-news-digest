export default function TranslationBadge({
  isTranslated,
  originalTitle,
  className = "",
}) {
  if (!isTranslated) return null;

  return (
    <div
      className={`group relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border border-teal-200 dark:border-teal-900/50 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 cursor-help ${className}`}
      title={originalTitle || "Gemini ile Türkçeye çevrildi"}
    >
      <span className="text-[10px] leading-none">🌐</span>
      <span>TR</span>

      {/* Hover tooltip for absolute positioning if we want a custom one, 
          but native title attribute usually suffices for small badges. */}
      {originalTitle && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1.5 bg-stone-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 hidden sm:block">
          <div>Orijinal başlık:</div>
          <div className="font-normal text-stone-300 max-w-50 truncate text-ellipsis">{originalTitle}</div>
        </div>
      )}
    </div>
  );
}
