import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          404 - Sayfa Bulunamadı
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          🏠 Anasayfaya Dön
        </Link>
      </div>
    </div>
  );
}
