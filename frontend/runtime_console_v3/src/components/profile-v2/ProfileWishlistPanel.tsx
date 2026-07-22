"use client";

import Link from "next/link";
import { Bell, Heart, ShoppingCart } from "lucide-react";
import { ProfileSummaryCard } from "@/components/profile-v2/ProfileSummaryCard";
import { useWishlist } from "@/hooks/useWishlist";
import { useBuyerDashboard } from "@/hooks/useBuyerExperience";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileWishlistPanel() {
  const { data, isLoading, isError } = useWishlist();
  const buyer = useBuyerDashboard();
  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Não foi possível carregar a wishlist.</p>
        <Link href="/entrar?next=/perfil/wishlist" className="mt-3 inline-block text-primary hover:underline">
          Entrar
        </Link>
      </div>
    );
  }

  const prices = items
    .map((it) =>
      typeof it.product?.price_cents === "number" ? it.product.price_cents / 100 : null,
    )
    .filter((n): n is number => n != null && Number.isFinite(n));

  const min = prices.length ? Math.min(...prices) : null;
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;

  return (
    <div className="space-y-6" data-testid="profile-wishlist-panel">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Wishlist</h1>
        <p className="text-small text-muted-foreground">
          Consome Wishlist API.{" "}
          <Link href="/colecao/wishlist" className="text-primary hover:underline">
            Abrir wishlist da coleção
          </Link>
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileSummaryCard
          label="Quantidade"
          value={String(items.length || buyer.data?.wishlist.total || 0)}
          icon={Heart}
          href="/colecao/wishlist"
        />
        <ProfileSummaryCard
          label="Preço mínimo"
          value={min != null ? min.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
        />
        <ProfileSummaryCard
          label="Preço médio"
          value={avg != null ? avg.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
        />
        <ProfileSummaryCard
          label="Alertas"
          value={String(buyer.data?.alerts?.active ?? 0)}
          href="/perfil/alertas"
          icon={Bell}
          hint={`Disparados: ${buyer.data?.alerts?.triggered ?? 0}`}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/colecao/alertas"
          className="inline-flex items-center gap-1.5 text-small text-primary hover:underline"
        >
          <Bell className="h-3.5 w-3.5" aria-hidden />
          Preço caiu / alertas
        </Link>
        <Link
          href="/loja/busca"
          className="inline-flex items-center gap-1.5 text-small text-primary hover:underline"
        >
          <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
          Comprar tudo (marketplace)
        </Link>
      </div>
      {items.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {items.slice(0, 12).map((it) => {
            const name = it.product?.name ?? it.product_id;
            return (
              <li key={it.product_id} className="px-4 py-3 text-sm">
                {name}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-small text-muted-foreground">Wishlist vazia.</p>
      )}
    </div>
  );
}
