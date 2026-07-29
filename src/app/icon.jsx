import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon — PWA ikonlarıyla aynı dil:
 * stone zemin + serif H + amber çizgi
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#f5f5f4",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#1c1917",
            fontFamily: "Georgia, 'Times New Roman', serif",
            lineHeight: 1,
            letterSpacing: "-1px",
            marginTop: 1,
          }}
        >
          H
        </span>
        <div
          style={{
            width: 10,
            height: 2,
            background: "#d97706",
            marginTop: 1,
            borderRadius: 1,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
