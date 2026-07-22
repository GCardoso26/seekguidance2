"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Droplets,
  Layers,
  Package,
  Repeat2,
  Sparkles,
  Wallet,
} from "lucide-react";
import { ProfileSummaryCard } from "@/components/profile-v2/ProfileSummaryCard";
import { useCollectionInsights } from "@/hooks/useCollectionInsights";
import { useWishlist } from "@/hooks/useWishlist";
import { formatCurrency } from "@/lib/format-currency";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileCollectionPanel() {
  const { data, isLoading, isError, error } = useCollectionInsights();
  const { data: wishlist } = useWishlist();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    const login = error instanceof Error && error.message === "login_required";
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {login ? "Entre para ver a coleção." : "Não foi possível carregar a coleção."}
        </p>
        {login && (
          <Link href="/entrar?next=/colecao" className="mt-3 inline-block text-primary hover:underline">
            Entrar
          </Link>
        )}
      </div>
    );
  }

  if (!data) return null;
  const currency = data.currency || "BRL";

  return (
    <div className="space-y-6" data-testid="profile-collection-panel">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Coleção</h1>
        <p className="text-small text-muted-foreground">
          Reutiliza Collection V2 — sem duplicar lógica.{" "}
          <Link href="/colecao" className="text-primary hover:underline">
            Abrir hub completo
          </Link>
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileSummaryCard
          label="Valor"
          value={data.totalValue != null ? formatCurrency(data.totalValue, currency) : "—"}
          href="/colecao"
          icon={Wallet}
        />
        <ProfileSummaryCard
          label="Duplicatas"
          value={String(data.duplicates)}
          href="/colecao/duplicatas"
          icon={Repeat2}
        />
        <ProfileSummaryCard
          label="Faltantes"
          value="Ver sets"
          href="/colecao/faltantes"
          icon={Package}
        />
        <ProfileSummaryCard
          label="Wishlist"
          value={String(wishlist?.items?.length ?? 0)}
          href="/colecao/wishlist"
          icon={Sparkles}
        />
        <ProfileSummaryCard
          label="Últimas aquisições"
          value={String(data.recentAcquisitions?.length ?? 0)}
          href="/colecao"
          icon={Layers}
        />
        <ProfileSummaryCard
          label="Maior valorização (7d)"
          value={
            data.valueChange7d != null && data.valueChange7d > 0
              ? formatCurrency(data.valueChange7d, currency)
              : "—"
          }
          tone="up"
          icon={ArrowUpRight}
        />
        <ProfileSummaryCard
          label="Maior desvalorização (7d)"
          value={
            data.valueChange7d != null && data.valueChange7d < 0
              ? formatCurrency(Math.abs(data.valueChange7d), currency)
              : "—"
          }
          tone="down"
          icon={ArrowDownRight}
        />
        <ProfileSummaryCard
          label="Liquidez média"
          value={data.avgLiquidity === "unknown" ? "—" : data.avgLiquidity}
          icon={Droplets}
        />
      </div>
    </div>
  );
}
