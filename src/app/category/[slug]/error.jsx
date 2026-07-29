"use client";

import { useEffect } from "react";
import {
  StatusActions,
  StatusPrimaryButton,
  StatusScreen,
  StatusSecondaryLink,
} from "@/app/components/StatusScreen";

export default function CategoryError({ error, reset }) {
  useEffect(() => {
    console.error("[category] Hata:", error);
  }, [error]);

  return (
    <StatusScreen
      kicker="Kategori"
      accent="danger"
      title="Haberler yüklenemedi"
      lede="Bu kategori açılırken bir hata oluştu. Biraz sonra tekrar dene."
    >
      <StatusActions>
        <StatusPrimaryButton onClick={reset}>Tekrar dene</StatusPrimaryButton>
        <StatusSecondaryLink href="/">Ana sayfa</StatusSecondaryLink>
      </StatusActions>
    </StatusScreen>
  );
}
