import { siteConfig } from "@/app/lib/siteConfig";
import SavedArticles from "@/app/components/SavedArticles";

export const metadata = {
  title: "Kaydedilenler",
  description: "Kaydettiğiniz haberler",
};

export default function SavedPage() {
  return (
    <div className="min-h-screen">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6">
        <SavedArticles />
      </div>
    </div>
  );
}
