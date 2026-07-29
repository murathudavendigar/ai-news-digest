import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch — public/apple-touch-icon ile aynı dil */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#f5f5f4",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 110,
            fontWeight: 900,
            color: "#1c1917",
            fontFamily: "Georgia, 'Times New Roman', serif",
            lineHeight: 1,
            letterSpacing: "-4px",
          }}
        >
          H
        </span>
        <div
          style={{
            width: 48,
            height: 8,
            background: "#d97706",
            marginTop: 8,
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
