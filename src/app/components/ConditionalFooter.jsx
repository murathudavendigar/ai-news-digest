"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

// Bu sayfalar tam ekran/gazete tasarımı — global footer gösterilmez
const HIDDEN_ON = ["/summary"];

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return null;
  return <Footer />;
}
