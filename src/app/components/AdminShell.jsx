"use client";

import { siteConfig } from "@/app/lib/siteConfig";
import { useEffect, useState } from "react";
import AdminDashboard from "./AdminDashboard";

export default function AdminShell() {
  const [authed, setAuthed] = useState(null); // null=checking, false=login, true=ok
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cookie var mı? — /api/admin'e boş istek at, 401 dönerse login göster
  useEffect(() => {
    fetch("/api/admin")
      .then((r) => setAuthed(r.status !== 401))
      .catch(() => setAuthed(false));
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Giriş başarısız");
    }
    setLoading(false);
  };

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthed(false);
    setEmail("");
    setPass("");
  };

  /* ── Checking ── */
  if (authed === null)
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-950">
        <div className="w-8 h-8 border-2 rounded-full border-amber-400 border-t-transparent animate-spin" />
      </div>
    );

  /* ── Login ── */
  if (!authed)
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-stone-950">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1
              className="mb-1 text-3xl font-black text-white"
              style={{ fontFamily: "Georgia, serif" }}>
              Haber<span className="text-amber-400">AI</span>
            </h1>
            <p className="text-sm text-stone-500">Admin Paneli</p>
          </div>

          <form
            onSubmit={login}
            className="p-6 space-y-4 border bg-stone-900 border-stone-800 rounded-2xl">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5
                         text-sm text-stone-100 placeholder-stone-600 outline-none
                         focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5
                         text-sm text-stone-100 placeholder-stone-600 outline-none
                         focus:border-amber-500 transition-colors"
              />
            </div>

            {error && (
              <p className="px-3 py-2 text-xs text-red-400 border rounded-lg bg-red-950/30 border-red-800/50">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950
                       font-black text-sm rounded-xl transition-colors disabled:opacity-50
                       flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 rounded-full border-stone-950/30 border-t-stone-950 animate-spin" />{" "}
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </form>
        </div>
      </div>
    );

  /* ── Dashboard ── */
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">
              {siteConfig.name}
            </p>
            <h1
              className="text-2xl font-black text-white"
              style={{ fontFamily: "Georgia, serif" }}>
              Admin Paneli
            </h1>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-xs font-bold transition-colors border rounded-xl bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200 border-stone-700">
            Çıkış
          </button>
        </div>

        <AdminDashboard />
      </div>
    </div>
  );
}
