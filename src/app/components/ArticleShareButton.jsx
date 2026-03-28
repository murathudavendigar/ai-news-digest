"use client";

import { useState } from 'react';

export default function ArticleShareButton({ url, title, columnistName }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} — ${columnistName} @haberai\n${url}`)}`, '_blank');
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`, '_blank');
  };

  return (
    <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
      <button 
        onClick={shareTwitter}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
        aria-label="X'te Paylaş"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
      </button>
      <button 
        onClick={shareWhatsApp}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-[#25D366] transition-colors"
        aria-label="WhatsApp'ta Paylaş"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.11 2.89a10 10 0 0 0-14.12 0L2 22l6.89-1.89a10 10 0 0 0 12.22-17.22z"></path><path d="M7.74 16.26l.46-.23c1.64-1.27 3.3.11 3.3.11l.82.8c.84.28 2.06-1.55 2.5-3.08a2.5 2.5 0 0 0-1.47-3l-1.3-.77v-.5c0-1.24-.76-2-2.34-2-1.32.22-4.5 5.5-2.73 7.85l.76.82z"></path></svg>
      </button>
      <button 
        onClick={handleCopy}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${copied ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500' : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300'}`}
        aria-label="Bağlantıyı Kopyala"
      >
        {copied ? (
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        )}
      </button>
    </div>
  );
}
