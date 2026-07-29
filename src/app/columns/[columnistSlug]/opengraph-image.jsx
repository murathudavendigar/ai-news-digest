import { renderColumnistOg } from "@/app/lib/columnOgImage";

export const alt = "HaberAI Köşe Yazarı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }) {
  const { columnistSlug } = await params;
  return renderColumnistOg({ columnistSlug });
}
