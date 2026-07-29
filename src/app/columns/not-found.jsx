import Link from "next/link";
import {
  StatusActions,
  StatusPrimaryLink,
  StatusScreen,
  StatusSecondaryLink,
} from "@/app/components/StatusScreen";

export default function ColumnsNotFound() {
  return (
    <StatusScreen
      mark="404"
      kicker="Köşe"
      title="Yazı bulunamadı"
      lede="Bu köşe yazısı veya yazar sayfası mevcut değil ya da kaldırılmış olabilir."
    >
      <StatusActions>
        <StatusPrimaryLink href="/columns">Köşe yazıları</StatusPrimaryLink>
        <StatusSecondaryLink href="/">Ana sayfa</StatusSecondaryLink>
      </StatusActions>
      <p className="mt-6">
        <Link href="/digest" className="article-text-link accent">
          Günün özetine bak →
        </Link>
      </p>
    </StatusScreen>
  );
}
