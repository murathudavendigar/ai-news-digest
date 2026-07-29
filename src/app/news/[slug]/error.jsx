"use client";

import { useEffect } from "react";
import {
  StatusActions,
  StatusPrimaryButton,
  StatusScreen,
  StatusSecondaryLink,
} from "@/app/components/StatusScreen";

export default function NewsDetailError({ error, reset }) {
  useEffect(() => {
    console.error("[news/detail] Hata:", error);
  }, [error]);

  return (
    <StatusScreen
      kicker="Haber"
      accent="danger"
      title="Haber yüklenemedi"
      lede="Bu haberi getirirken bir sorun oluştu. Lütfen tekrar dene."
    >
      <StatusActions>
        <StatusPrimaryButton onClick={reset}>Tekrar dene</StatusPrimaryButton>
        <StatusSecondaryLink href="/">Ana sayfa</StatusSecondaryLink>
      </StatusActions>
    </StatusScreen>
  );
}
