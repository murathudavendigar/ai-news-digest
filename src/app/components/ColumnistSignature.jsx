/**
 * ColumnistSignature — Displays a columnist's name in handwriting style.
 * Uses Caveat font (--font-signature) with a thin underline flourish.
 */
export default function ColumnistSignature({
  name,
  accentColor = "#6B7280",
  size = "md",
}) {
  const sizes = {
    sm: { fontSize: "1.25rem", lineW: 80 },
    md: { fontSize: "1.875rem", lineW: 120 },
    lg: { fontSize: "2.25rem", lineW: 160 },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-start">
      <span
        className="block font-semibold"
        style={{
          fontFamily: "var(--font-signature, 'Caveat', cursive)",
          fontSize: s.fontSize,
          color: accentColor,
          transform: "rotate(-1.5deg)",
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.08))",
        }}>
        {name}
      </span>
      {/* Underline flourish */}
      <svg
        width={s.lineW}
        height="6"
        viewBox={`0 0 ${s.lineW} 6`}
        fill="none"
        style={{ marginTop: 2, transform: "rotate(-1.5deg)" }}>
        <path
          d={`M2 4 Q${s.lineW * 0.3} 1 ${s.lineW * 0.5} 3 T${s.lineW - 2} 2`}
          stroke={accentColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
