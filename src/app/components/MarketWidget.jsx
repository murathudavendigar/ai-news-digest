import { fetchMarketData } from "@/app/lib/realTimeData";

/**
 * MarketWidget — Server component
 * Shows key market indicators in a clean vertical list.
 * Sidebar on desktop, hidden on mobile (shown via home-sidebar CSS).
 */
export default async function MarketWidget() {
  let data = null;

  try {
    data = await fetchMarketData();
  } catch {
    return null;
  }

  if (!data) return null;

  const items = [
    {
      ticker: "BIST100",
      name: "Borsa İstanbul",
      value: data.bist100,
      change: data.bist100Change,
    },
    {
      ticker: "USD/TRY",
      name: "Amerikan Doları",
      value: data.usdTry,
      change: null,
    },
    {
      ticker: "EUR/TRY",
      name: "Euro",
      value: data.eurTry,
      change: null,
    },
    {
      ticker: "ALTIN",
      name: "Gram Altın",
      value: data.goldGram ? `₺${data.goldGram}` : "—",
      change: null,
    },
  ];

  const fetchedAt = data.fetchedAt
    ? new Date(data.fetchedAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <section
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)",
        padding: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          Piyasalar
        </h3>
        {fetchedAt && (
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            {fetchedAt}
          </span>
        )}
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item, idx) => {
          const isPositive = item.change?.startsWith("+");
          const isNegative = item.change?.startsWith("-");
          const changeColor = isPositive
            ? "var(--success)"
            : isNegative
              ? "var(--danger)"
              : "var(--text-muted)";
          const changeBg = isPositive
            ? "rgba(22, 163, 74, 0.12)"
            : isNegative
              ? "rgba(220, 38, 38, 0.12)"
              : "transparent";

          return (
            <div
              key={item.ticker}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                ...(idx < items.length - 1
                  ? {
                      borderBottom: "1px solid var(--border-subtle)",
                    }
                  : {}),
              }}
            >
              {/* Left: ticker + name */}
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {item.ticker}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color: "var(--text-muted)",
                  }}
                >
                  {item.name}
                </p>
              </div>

              {/* Right: value + change */}
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {item.value}
                </p>
                {item.change && item.change !== "—" && (
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "2px",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: "4px",
                      color: changeColor,
                      background: changeBg,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {item.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p
        style={{
          margin: "12px 0 0",
          fontSize: "10px",
          color: "var(--text-muted)",
        }}
      >
        {data.note || "Veriler gecikmeli olabilir"}
      </p>
    </section>
  );
}
