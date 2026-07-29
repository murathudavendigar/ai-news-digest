import { renderColumnOg } from "@/app/lib/columnOgImage";

export const alt = "HaberAI Köşe Yazısı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }) {
  const { columnistSlug, columnSlug } = await params;
  return renderColumnOg({ columnistSlug, columnSlug });
}
