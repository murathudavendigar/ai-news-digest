"use client";

import "./globals.css";
import { useEffect } from "react";

/**
 * Root layout çökerse burası çalışır — kendi html/body'si olmalı.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[app] Global hata:", error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafaf9",
          color: "#1c1917",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "5rem",
              fontWeight: 900,
              lineHeight: 1,
              color: "#e7e5e4",
              userSelect: "none",
            }}
          >
            !
          </p>
          <div
            style={{
              width: 64,
              height: 2,
              background: "#dc2626",
              margin: "0 auto 20px",
            }}
          />
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "1.75rem",
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Uygulama yüklenemedi
          </h1>
          <p
            style={{
              margin: "0 0 28px",
              fontSize: "0.9rem",
              lineHeight: 1.55,
              color: "#78716c",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Kritik bir hata oluştu. Sayfayı yenilemeyi dene.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: "1px solid #1c1917",
              background: "#1c1917",
              color: "#fafaf9",
              padding: "10px 20px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
