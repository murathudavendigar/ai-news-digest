"use client";

import { useState } from "react";

export default function SubscribeForm({ accent = "#f59e0b" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | success | already | error
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kayıt hatası");
      setState(data.message === "already_subscribed" ? "already" : "success");
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  }

  if (state === "success")
    return (
      <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-stone-800 border border-stone-700">
        <span style={{ color: accent }}>✓</span>
        <p className="text-xs text-stone-300">
          Abone oldunuz! Her sabah geliyor.
        </p>
      </div>
    );

  if (state === "already")
    return (
      <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-stone-800 border border-stone-700">
        <span className="text-stone-400">ℹ</span>
        <p className="text-xs text-stone-400">Bu e-posta zaten kayıtlı.</p>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="e-posta adresiniz"
        required
        className="w-52 px-4 py-2 text-xs rounded-full bg-stone-800 border border-stone-700
                   text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-500
                   transition-colors"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="px-5 py-2 rounded-full text-xs font-bold text-stone-950 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: accent }}>
        {state === "loading" ? "…" : "Abone Ol"}
      </button>
      {state === "error" && (
        <span className="text-[10px] text-red-400">{error}</span>
      )}
    </form>
  );
}
