import type { Metadata } from "next";
import { CollectionNav } from "@/components/collection-v2/CollectionNav";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/colecao", {
  title: "Minha Coleção",
  description: "Biblioteca viva — valor, progresso, wishlist e duplicatas no JudgeTCG.",
  robots: { index: false, follow: false },
});

export default function ColecaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileLayout>
      <div className="page-container py-6 lg:py-8">
        <CollectionNav />
        <div className="mt-6">{children}</div>
      </div>
    </MobileLayout>
  );
}
