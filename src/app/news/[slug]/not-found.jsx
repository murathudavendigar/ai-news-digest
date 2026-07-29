import {
  StatusActions,
  StatusPrimaryLink,
  StatusScreen,
  StatusSecondaryLink,
} from "@/app/components/StatusScreen";

export default function NewsNotFound() {
  return (
    <StatusScreen
      mark="404"
      kicker="Arşiv"
      title="Bu haber baskıda yok"
      lede="Önbellekte bulunamadı veya bağlantı geçersiz. Ana sayfadan güncel manşetlere dönebilirsin."
    >
      <StatusActions>
        <StatusPrimaryLink href="/">Ana sayfa</StatusPrimaryLink>
        <StatusSecondaryLink href="/digest">Günün özeti</StatusSecondaryLink>
      </StatusActions>
    </StatusScreen>
  );
}
