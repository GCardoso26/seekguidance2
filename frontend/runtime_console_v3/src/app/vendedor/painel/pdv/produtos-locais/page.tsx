"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/seller-dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { useSellerStore } from "@/hooks/useSellerStore";
import { planHasFeature } from "@/lib/seller-plans";

const PdvLocalProductsManager = dynamic(
  () =>
    import("@/components/seller-dashboard/pdv/PdvLocalProductsManager").then(
      (m) => m.PdvLocalProductsManager,
    ),
  { loading: () => <PageSkeleton rows={8} />, ssr: false },
);

export default function PdvLocalProductsPage() {
  const { storeId, hasStore, dashboard, isLoading: storeLoading } = useSellerStore();
  const plan = String(
    (dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free",
  );
  const hasPdv = planHasFeature(plan, "pdv");

  if (storeLoading) {
    return <main className="p-8 text-muted-foreground">Carregando…</main>;
  }

  if (!hasStore || !storeId) {
    return (
      <main className="p-8 text-center text-muted-foreground">
        <Link href="/vendedor/painel/onboarding" className="text-primary underline">
          Cadastre sua loja
        </Link>
      </main>
    );
  }

  if (!hasPdv) {
    return (
      <main className="p-8 text-center" data-testid="pdv-upsell">
        <p className="text-muted-foreground">PDV disponível no plano Pro.</p>
        <Button asChild className="mt-4">
          <Link href="/vendedor/painel/planos">Ver planos</Link>
        </Button>
      </main>
    );
  }

  return <PdvLocalProductsManager storeId={storeId} />;
}
