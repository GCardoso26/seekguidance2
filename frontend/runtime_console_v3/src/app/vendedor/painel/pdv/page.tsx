"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { PageHeader, PageShell, PageSkeleton } from "@/components/seller-dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { useSellerStore } from "@/hooks/useSellerStore";
import { planHasFeature } from "@/lib/seller-plans";

const PdvManager = dynamic(
  () => import("@/components/seller-dashboard/pdv/PdvManager").then((m) => m.PdvManager),
  { loading: () => <PageSkeleton rows={8} />, ssr: false },
);

export default function PdvPage() {
  const { storeId, hasStore, dashboard, isLoading: storeLoading } = useSellerStore();
  const plan = String((dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free");
  const storeName = String((dashboard?.store as Record<string, unknown> | undefined)?.name ?? "Minha loja");
  const hasPdv = planHasFeature(plan, "pdv");

  if (storeLoading) {
    return <main className="p-8 text-luxury-mist">Carregando…</main>;
  }

  if (!hasStore || !storeId) {
    return (
      <main className="p-8 text-center text-luxury-mist">
        <Link href="/stores/create" className="text-luxury-gold underline">
          Cadastre sua loja
        </Link>
      </main>
    );
  }

  if (!hasPdv) {
    return (
      <main className="p-8 text-center" data-testid="pdv-upsell">
        <p className="text-luxury-mist">PDV disponível no plano Pro.</p>
        <Button asChild className="mt-4">
          <Link href="/vendedor/painel/planos">Ver planos</Link>
        </Button>
      </main>
    );
  }

  return (
    <PageShell className="max-w-none px-4 py-4 lg:px-6">
      <div className="mb-4 hidden items-center justify-between lg:flex">
        <PageHeader title="PDV" description="Vendas no balcão — escaneie, finalize e imprima o cupom." />
        <Button asChild variant="outline" size="sm">
          <Link href="/vendedor/painel">← Voltar ao painel</Link>
        </Button>
      </div>
      <div className="mb-2 lg:hidden">
        <h2 className="text-xl font-bold">PDV</h2>
        <p className="text-sm text-luxury-mist">Vendas no balcão</p>
      </div>
      <PdvManager storeId={storeId} storeName={storeName} />
    </PageShell>
  );
}
