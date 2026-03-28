"use client";

import { useState } from 'react';
import Image from 'next/image';

export default function QuoteShareButton({ columnistSlug, columnSlug, columnTitle, columnistName, quote }) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState('landscape'); // 'landscape' or 'square'
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState('');

  const imageUrl = `/api/columns/${columnistSlug}/${columnSlug}/quote-image?format=${format}`;
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url;
      a.download = `haberai-${columnSlug}-alinti.png`; 
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${columnistName} Yazısı: ${columnTitle}`,
          text: `"${quote}" — ${columnistName}`,
          url: pageUrl
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(pageUrl);
      setToast('Link kopyalandı!');
      setTimeout(() => setToast(''), 2500);
    }
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${quote}"\n\n— ${columnistName} @haberai\n\n${pageUrl}`)}`);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`"${quote}"\n\n— ${columnistName}\n${pageUrl}`)}`);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium transition-colors text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        Alıntıyı Paylaş
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-lg dark:text-white">Alıntıyı Paylaş</h3>
              <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-center gap-2 mb-6 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                <button 
                  onClick={() => setFormat('landscape')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${format === 'landscape' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
                >
                  Yatay (Twitter/X)
                </button>
                <button 
                  onClick={() => setFormat('square')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${format === 'square' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
                >
                  Kare (Instagram)
                </button>
              </div>

              <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-4 flex justify-center mb-6 overflow-hidden">
                <Image 
                  src={imageUrl} 
                  alt="Alıntı Görseli" 
                  width={1200}
                  height={630}
                  unoptimized
                  className={`rounded-xl shadow-md border border-stone-200 dark:border-stone-800 object-contain ${format === 'square' ? 'max-h-75 w-auto' : 'w-full h-auto'}`}
                />
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <button onClick={handleDownload} disabled={isDownloading} className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 text-white font-medium rounded-xl transition-colors disabled:opacity-70">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    {isDownloading ? 'İndiriliyor...' : 'Görseli İndir'}
                  </button>
                  <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-white font-medium rounded-xl transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    {toast ? toast : 'Bağlantıyı Paylaş'}
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button onClick={shareTwitter} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0f1419] hover:bg-[#272c30] text-white font-medium rounded-xl transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                    X&apos;te Paylaş
                  </button>
                  <button onClick={shareWhatsApp} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#22bf5b] text-white font-medium rounded-xl transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.11 2.89a10 10 0 0 0-14.12 0L2 22l6.89-1.89a10 10 0 0 0 12.22-17.22z"></path><path d="M7.74 16.26l.46-.23c1.64-1.27 3.3.11 3.3.11l.82.8c.84.28 2.06-1.55 2.5-3.08a2.5 2.5 0 0 0-1.47-3l-1.3-.77v-.5c0-1.24-.76-2-2.34-2-1.32.22-4.5 5.5-2.73 7.85l.76.82z"></path></svg>
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
