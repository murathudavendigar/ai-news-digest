"use client";

import { CITIES } from "@/app/lib/cityConfig";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "haberai:city";

function weatherIcon(condition = "") {
  const c = String(condition).toLowerCase();
  if (c.includes("fırtına")) return "⛈️";
  if (c.includes("sağanak")) return "🌧️";
  if (c.includes("yağmur")) return "🌦️";
  if (c.includes("kar")) return "❄️";
  if (c.includes("sis")) return "🌫️";
  if (c.includes("parçalı")) return "⛅";
  if (c.includes("bulut")) return "☁️";
  if (c.includes("açık")) return "☀️";
  return "🌤️";
}

/** Safely stringify a weather field — prevents objects leaking into JSX children */
function s(v, fallback = "—") {
  if (v == null) return fallback;
  if (typeof v === "object") return fallback;
  return String(v);
}

// ── Compact (masthead şeridi) ──────────────────────────────────────────────
export function WeatherStrip({ defaultWeather }) {
  const [weather, setWeather] = useState(defaultWeather);
  // Always "Istanbul" on first render (SSR + client) → no hydration mismatch
  const [city, setCity] = useState("Istanbul");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Load saved city AFTER hydration (useEffect = client-only)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || saved === "Istanbul") return;
    fetch(`/api/weather?city=${saved}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setCity(saved);
        if (d && !d.error) setWeather(d);
      })
      .catch(() => setCity(saved));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(key) {
    setCity(key);
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, key);
    fetch(`/api/weather?city=${key}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && !d.error && setWeather(d))
      .catch(() => {});
  }

  if (!weather) return null;

  const cityLabel = s(weather.city, city);
  const temp = weather.tempRange
    ? s(weather.tempRange)
    : `${s(weather.tempHigh)}° / ${s(weather.tempLow)}°`;

  return (
    <span className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 transition-colors cursor-pointer hover:text-stone-300"
        title="Şehri değiştir">
        {weatherIcon(weather.condition)} {cityLabel}: {temp}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 py-0.5 bg-white border shadow-lg dark:bg-stone-900 border-stone-200 dark:border-stone-700 min-w-28 max-h-48 overflow-y-auto">
          {CITIES.map((c) => (
            <button
              key={c.key}
              onClick={() => handleSelect(c.key)}
              className={`w-full text-left px-2.5 py-1 text-[9px] uppercase tracking-widest transition-colors
                ${
                  city === c.key
                    ? "text-stone-900 dark:text-white font-black bg-stone-100 dark:bg-stone-800"
                    : "text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800"
                }`}>
              {c.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

// ── Full (sidebar widget) ──────────────────────────────────────────────────
export function WeatherWidget({ defaultWeather }) {
  const [weather, setWeather] = useState(defaultWeather);
  const [city, setCity] = useState("Istanbul");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || saved === "Istanbul") return;
    fetch(`/api/weather?city=${saved}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setCity(saved);
        if (d && !d.error) setWeather(d);
      })
      .catch(() => setCity(saved))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(key) {
    setCity(key);
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, key);
    setLoading(true);
    fetch(`/api/weather?city=${key}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.error) setWeather(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  if (!weather) return null;

  const cityLabel = s(
    weather.city,
    CITIES.find((c) => c.key === city)?.label ?? "Hava",
  );
  const temp = weather.tempRange
    ? s(weather.tempRange)
    : `${s(weather.tempHigh)}° / ${s(weather.tempLow)}°`;
  const humidity = s(weather.humidity, "");
  const condition = s(weather.condition, "");
  const note = s(weather.note, "");
  const dropdownLabel = CITIES.find((c) => c.key === city)?.label ?? "Şehir";

  return (
    <div className="py-5" ref={ref}>
      {/* Başlık + şehir seçici */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest">
          🏙️ {cityLabel} Hava
        </p>
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-[8px] text-stone-500 hover:text-stone-900 dark:hover:text-white uppercase tracking-widest transition-colors border border-stone-300 dark:border-stone-700 px-1.5 py-0.5">
            {dropdownLabel} ▾
          </button>

          {/* Şehir dropdown */}
          {open && (
            <div className="absolute right-0 top-full mt-1 z-50 py-0.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-lg min-w-24 max-h-44 overflow-y-auto">
              {CITIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => handleSelect(c.key)}
                  className={`w-full text-left px-2.5 py-1 text-[9px] uppercase tracking-widest transition-colors
                    ${
                      city === c.key
                        ? "text-stone-900 dark:text-white font-black bg-stone-100 dark:bg-stone-800"
                        : "text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800"
                    }`}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hava kartı */}
      <div
        className={`flex items-center gap-3 transition-opacity ${loading ? "opacity-40" : "opacity-100"}`}>
        <span className="text-4xl">{weatherIcon(condition)}</span>
        <div>
          <p className="text-lg font-black text-stone-900 dark:text-white">
            {loading ? "…" : temp}
          </p>
          {condition && <p className="text-xs text-stone-500">{condition}</p>}
          {humidity && humidity !== "—" && (
            <p className="text-[10px] text-stone-600">💧 %{humidity} nem</p>
          )}
          {note && note !== "—" && (
            <p className="text-[10px] text-stone-600 italic mt-0.5">{note}</p>
          )}
        </div>
      </div>
    </div>
  );
}
