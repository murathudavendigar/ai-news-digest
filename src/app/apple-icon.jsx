import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 512,
        height: 512,
        background:
          "linear-gradient(135deg, #d97706 0%, #f59e0b 60%, #fbbf24 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
      <span
        style={{
          fontSize: 320,
          fontWeight: 900,
          color: "#1c1917",
          fontFamily: "Georgia, serif",
          lineHeight: 1,
          letterSpacing: "-12px",
        }}>
        H
      </span>
    </div>,
    { ...size },
  );
}
