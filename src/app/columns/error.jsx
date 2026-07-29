"use client";

import { useEffect } from "react";
import {
  StatusActions,
  StatusPrimaryButton,
  StatusScreen,
  StatusSecondaryLink,
} from "@/app/components/StatusScreen";

export default function ColumnsError({ error, reset }) {
  useEffect(() => {
    console.error("[columns] Hata:", error);
  }, [error]);

  return (
    <StatusScreen
      kicker="Köşe"
      accent="danger"
      title="Köşe yüklenemedi"
      lede="Bu yazıyı getirirken bir sorun oluştu. Lütfen tekrar dene."
    >
      <StatusActions>
        <StatusPrimaryButton onClick={reset}>Tekrar dene</StatusPrimaryButton>
        <StatusSecondaryLink href="/columns">Köşe yazıları</StatusSecondaryLink>
      </StatusActions>
    </StatusScreen>
  );
}
