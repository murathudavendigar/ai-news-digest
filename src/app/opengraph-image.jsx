import { siteConfig } from "@/app/lib/siteConfig";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#1c1917",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Georgia, serif",
      }}>
      {/* Arka plan deseni */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(217,119,6,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(217,119,6,0.08) 0%, transparent 60%)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 24,
        }}>
        <span
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-2px",
          }}>
          {siteConfig.logoPrimary}
        </span>
        <span
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: "#fbbf24",
            letterSpacing: "-2px",
          }}>
          {siteConfig.logoAccent}
        </span>
      </div>

      {/* Tagline */}
      <p
        style={{
          fontSize: 28,
          color: "#a8a29e",
          letterSpacing: "4px",
          textTransform: "uppercase",
          margin: 0,
        }}>
        {siteConfig.tagline}
      </p>

      {/* Alt bant */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          display: "flex",
          gap: 32,
          fontSize: 18,
          color: "#57534e",
        }}>
        <span>🇹🇷 Türkiye</span>
        <span>🌍 Dünya</span>
        <span>🤖 AI Analiz</span>
      </div>
    </div>,
    { ...size },
  );
}
