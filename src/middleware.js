import { NextResponse } from "next/server";
import { siteConfig } from "@/app/lib/siteConfig";

/**
 * - Eski Vercel host → kanonik domain (301)
 * - www → apex (301)
 * - Eski path alias'ları (/summary, /world, /international)
 */
export function middleware(request) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() || "";

  let canonicalHost;
  try {
    canonicalHost = new URL(siteConfig.url).host;
  } catch {
    canonicalHost = "haberai.muratoncu.com";
  }

  const legacyHosts = new Set([
    ...(siteConfig.legacyHosts || []),
    `www.${canonicalHost}`,
  ]);

  // Path alias'ları (host fark etmeksizin)
  const pathRedirects = {
    "/summary": "/digest",
    "/international": "/category/world",
    "/world": "/category/world",
  };

  if (pathRedirects[url.pathname]) {
    url.pathname = pathRedirects[url.pathname];
    if (legacyHosts.has(host) && host !== canonicalHost) {
      url.host = canonicalHost;
      url.protocol = "https:";
      url.port = "";
    }
    return NextResponse.redirect(url, 301);
  }

  if (host && host !== canonicalHost && legacyHosts.has(host)) {
    url.host = canonicalHost;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * API, next static, image, SW, manifest hariç
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-|apple-touch|.*\\.(?:png|jpg|jpeg|webp|svg|ico|woff2)$).*)",
  ],
};
