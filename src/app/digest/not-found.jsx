import {
  StatusActions,
  StatusPrimaryLink,
  StatusScreen,
  StatusSecondaryLink,
} from "@/app/components/StatusScreen";

export default function SummaryNotFound() {
  return (
    <StatusScreen
      mark="404"
      kicker="Baskı"
      title="Baskı bulunamadı"
      lede="Bu tarihe ait günün özeti mevcut değil."
    >
      <StatusActions>
        <StatusPrimaryLink href="/digest">Bugünün baskısı</StatusPrimaryLink>
        <StatusSecondaryLink href="/">Ana sayfa</StatusSecondaryLink>
      </StatusActions>
    </StatusScreen>
  );
}
