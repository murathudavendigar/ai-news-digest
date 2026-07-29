import { ImageResponse } from "next/og";
import { getColumnistAccent } from "@/app/lib/columnistConfig";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function brandFallback(label = "HaberAI") {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1c1917",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 900,
            color: "#fafaf9",
            letterSpacing: "-1px",
          }}
        >
          Haber
          <span style={{ color: "#f59e0b" }}>AI</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 22,
            color: "#a8a29e",
          }}
        >
          {label}
        </div>
      </div>
    ),
    { ...size },
  );
}

async function fetchJson(path) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;

  const res = await fetch(`${base}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    // OG her istekte taze veri
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

function formatTrDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const months = [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ];
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  } catch {
    return "";
  }
}

function clip(text, max) {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Tek yazı OG */
export async function renderColumnOg({ columnistSlug, columnSlug }) {
  try {
    const [columns, columnists] = await Promise.all([
      fetchJson(
        `columns?slug=eq.${encodeURIComponent(columnSlug)}&select=title,subtitle,read_time_minutes,published_at&limit=1`,
      ),
      fetchJson(
        `columnists?slug=eq.${encodeURIComponent(columnistSlug)}&select=name,title&limit=1`,
      ),
    ]);

    const column = Array.isArray(columns) ? columns[0] : null;
    const columnist = Array.isArray(columnists) ? columnists[0] : null;
    if (!column || !columnist) {
      return brandFallback("Köşe yazısı");
    }

    const accent = getColumnistAccent(columnistSlug);
    const dateLabel = formatTrDate(column.published_at);
    const readLabel = column.read_time_minutes
      ? `${column.read_time_minutes} dk okuma`
      : "";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0c0a09",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          <div
            style={{
              width: "100%",
              height: 8,
              display: "flex",
              backgroundColor: accent.primary,
            }}
          />

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "56px 72px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#fafaf9",
                }}
              >
                Haber
                <span style={{ color: "#f59e0b" }}>AI</span>
              </div>
              <div
                style={{
                  display: "flex",
                  backgroundColor: accent.primary,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "6px 14px",
                  letterSpacing: "0.08em",
                }}
              >
                KÖŞE YAZISI
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div
                style={{
                  display: "flex",
                  color: "#fafaf9",
                  fontSize: 52,
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-1px",
                  maxWidth: 1000,
                }}
              >
                {clip(column.title, 90)}
              </div>
              {column.subtitle ? (
                <div
                  style={{
                    display: "flex",
                    color: "#a8a29e",
                    fontSize: 24,
                    lineHeight: 1.4,
                    maxWidth: 920,
                  }}
                >
                  {clip(column.subtitle, 140)}
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  style={{
                    display: "flex",
                    color: accent.primary,
                    fontSize: 34,
                    fontWeight: 700,
                    fontStyle: "italic",
                  }}
                >
                  {columnist.name}
                </div>
                {columnist.title ? (
                  <div
                    style={{
                      display: "flex",
                      color: "#78716c",
                      fontSize: 18,
                    }}
                  >
                    {columnist.title}
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                  color: "#78716c",
                  fontSize: 18,
                }}
              >
                {dateLabel ? <div style={{ display: "flex" }}>{dateLabel}</div> : null}
                {readLabel ? <div style={{ display: "flex" }}>{readLabel}</div> : null}
              </div>
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  } catch (err) {
    console.error("[OG column]", err);
    return brandFallback("Köşe yazısı");
  }
}

/** Yazar profil OG */
export async function renderColumnistOg({ columnistSlug }) {
  try {
    const columnists = await fetchJson(
      `columnists?slug=eq.${encodeURIComponent(columnistSlug)}&select=name,title&limit=1`,
    );
    const columnist = Array.isArray(columnists) ? columnists[0] : null;
    if (!columnist) return brandFallback("Köşe yazarı");

    const accent = getColumnistAccent(columnistSlug);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0c0a09",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          <div
            style={{
              width: "100%",
              height: 8,
              display: "flex",
              backgroundColor: accent.primary,
            }}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 80px",
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: accent.primary,
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                padding: "8px 20px",
                letterSpacing: "0.12em",
                marginBottom: 36,
              }}
            >
              HABERAI KÖŞE YAZARI
            </div>
            <div
              style={{
                display: "flex",
                color: accent.primary,
                fontSize: 72,
                fontWeight: 800,
                fontStyle: "italic",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {columnist.name}
            </div>
            {columnist.title ? (
              <div
                style={{
                  display: "flex",
                  color: "#a8a29e",
                  fontSize: 28,
                  textAlign: "center",
                }}
              >
                {columnist.title}
              </div>
            ) : null}
          </div>
          <div
            style={{
              width: "100%",
              height: 8,
              display: "flex",
              backgroundColor: accent.primary,
            }}
          />
        </div>
      ),
      { ...size },
    );
  } catch (err) {
    console.error("[OG columnist]", err);
    return brandFallback("Köşe yazarı");
  }
}
