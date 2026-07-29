"use client";

import { useEffect } from "react";
import {
  StatusActions,
  StatusDevDetail,
  StatusPrimaryButton,
  StatusScreen,
  StatusSecondaryLink,
} from "@/app/components/StatusScreen";

export default function SummaryError({ error, reset }) {
  useEffect(() => {
    console.error("[digest] Hata:", error);
  }, [error]);

  return (
    <StatusScreen
      mark="!"
      kicker="Baskı"
      accent="danger"
      title="Baskı hazırlanamadı"
      lede="Günün özeti oluşturulurken bir hata oluştu. Sabah otomatik üretilir; şimdi yeniden deneyebilirsin."
    >
      <StatusDevDetail error={error} />
      <StatusActions>
        <StatusPrimaryButton onClick={reset}>Tekrar dene</StatusPrimaryButton>
        <StatusSecondaryLink href="/">Ana sayfa</StatusSecondaryLink>
      </StatusActions>
    </StatusScreen>
  );
}
