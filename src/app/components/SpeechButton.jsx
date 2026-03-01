"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API ile metin okuma — sıfır API maliyeti
// Türkçe TTS tüm modern tarayıcılarda (Chrome/Edge/Safari/Firefox) mevcut
export default function SpeechButton({
  text, // Okunacak metin (string veya string[])
  label = "Sesli Dinle",
}) {
  // Lazy init: SSR'da veya tarayıcı desteklemiyorsa hemen "unsupported" başlat
  const [state, setState] = useState(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window))
      return "unsupported";
    return "idle";
  }); // idle | speaking | paused | unsupported
  const utterRef = useRef(null);

  // Sayfa unmount olduğunda durdur
  useEffect(() => {
    return () => {
      if (utterRef.current) window.speechSynthesis?.cancel();
    };
  }, []);

  const getVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    // Türkçe ses tercih et
    return (
      voices.find((v) => v.lang === "tr-TR") ||
      voices.find((v) => v.lang.startsWith("tr")) ||
      null
    );
  }, []);

  const speak = useCallback(() => {
    const content = Array.isArray(text) ? text.join(". ") : text;
    if (!content) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(content);
    utter.lang = "tr-TR";
    utter.rate = 0.92;
    utter.pitch = 1;

    const voice = getVoice();
    if (voice) utter.voice = voice;

    utter.onstart = () => setState("speaking");
    utter.onend = () => setState("idle");
    utter.onpause = () => setState("paused");
    utter.onresume = () => setState("speaking");
    utter.onerror = () => setState("idle");

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [text, getVoice]);

  const toggle = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    if (state === "speaking") {
      window.speechSynthesis.pause();
    } else if (state === "paused") {
      window.speechSynthesis.resume();
    } else {
      speak();
    }
  }, [state, speak]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setState("idle");
  }, []);

  // Chrome'da getVoices async yüklenir — ilk renderda boş dönebilir
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {}; // trigger load
    }
  }, []);

  if (state === "unsupported") return null;

  const icons = {
    idle: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
      </svg>
    ),
    speaking: (
      <svg
        className="w-4 h-4 animate-pulse"
        fill="currentColor"
        viewBox="0 0 24 24">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
      </svg>
    ),
    paused: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggle}
        title={
          state === "speaking"
            ? "Duraklat"
            : state === "paused"
              ? "Devam Et"
              : label
        }
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
          ${
            state === "speaking"
              ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
              : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
          }`}>
        {icons[state] || icons.idle}
        <span className="hidden sm:inline">
          {state === "speaking"
            ? "Durdur"
            : state === "paused"
              ? "Devam"
              : label}
        </span>
      </button>
      {(state === "speaking" || state === "paused") && (
        <button
          onClick={stop}
          title="Kapat"
          className="w-6 h-6 flex items-center justify-center rounded-full bg-stone-800 text-stone-400 hover:text-white transition-colors text-xs">
          ✕
        </button>
      )}
    </div>
  );
}
