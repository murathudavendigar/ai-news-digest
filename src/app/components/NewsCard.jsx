
import { formatDate } from "@/app/lib/news";
import Link from "next/link";

export default function NewsCard({ article, priority = false }) {
  return (
    <Link
      href={`/news/${article.article_id}`}
      className="block overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-md group dark:bg-gray-800 rounded-xl hover:shadow-xl dark:border-gray-700">
      {/* Görsel */}
      <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700">
            <span className="text-8xl">📰</span>
          </div>
        )}

        {/* Kaynak Badge */}
        <div className="absolute px-3 py-1 rounded-full top-3 left-3 bg-black/70 backdrop-blur-sm">
          <span className="flex items-center gap-1 text-xs font-semibold text-white">
            <img
              src={article.source_icon}
              className="w-4 h-4 rounded-full"
              alt={article.source_name}
            />
            {article.source_name}
          </span>
        </div>
      </div>

      {/* İçerik */}
      <div className="p-5">
        <h3
          className="mb-2 text-lg font-bold text-gray-900 transition-colors dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400">
          {article.title}
        </h3>

        {article.description && (
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {article.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {formatDate(article.pubDate)}
          </span>

          {article.creator && (
            <span className="truncate ml-2 max-w-37.5">
              {article.creator
                ? article.creator[0].toUpperCase()
                : "Bilinmeyen Yazar"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
