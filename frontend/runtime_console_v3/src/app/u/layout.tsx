import type { Metadata } from "next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { withCanonical } from "@/lib/page-metadata";
import { brand } from "@/lib/brand";

export const metadata: Metadata = withCanonical("/u", {
  title: "Perfis públicos",
  description: "Perfis de jogadores no JudgeTCG.",
  robots: { index: true, follow: true },
});

export default function PublicProfilesLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileLayout>
      <div className="page-container py-6 lg:py-8">{children}</div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: brand.name,
            url: brand.url,
          }),
        }}
      />
    </MobileLayout>
  );
}
