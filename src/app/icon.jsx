import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
      <span
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: "#1c1917",
          fontFamily: "Georgia, serif",
          lineHeight: 1,
          letterSpacing: "-1px",
        }}>
        H
      </span>
    </div>,
    { ...size },
  );
}
