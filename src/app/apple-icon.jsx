import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: 40,
        background:
          "linear-gradient(135deg, #d97706 0%, #f59e0b 60%, #fbbf24 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
      <span
        style={{
          fontSize: 108,
          fontWeight: 900,
          color: "#1c1917",
          fontFamily: "Georgia, serif",
          lineHeight: 1,
          letterSpacing: "-4px",
        }}>
        H
      </span>
    </div>,
    { ...size },
  );
}
