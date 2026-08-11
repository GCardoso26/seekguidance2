"use client";

import Link from "next/link";
import { Heart, Package, ShoppingBag, Truck } from "lucide-react";
import { GalleryCountUp, GalleryFade } from "@/components/gallery/GalleryMotion";
import { ProfileSummaryCard } from "@/components/profile-v2/ProfileSummaryCard";
import { useBuyerDashboard } from "@/hooks/useBuyerExperience";
import { formatCurrency } from "@/lib/format-currency";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePurchasesPanel() {
  const { data, isLoading, isError, error } = useBuyerDashboard();

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
    const login = error instanceof Error && error.message === "login_required";
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {login ? "Entre para ver compras." : "Não foi possível carregar pedidos."}
        </p>
        {login && (
          <Link href="/entrar?next=/perfil/compras" className="mt-3 inline-block text-primary hover:underline">
            Entrar
          </Link>
        )}
      </div>
    );
  }

  if (!data) return null;

  const inTransit = data.orders.in_progress ?? [];
  const recent = data.orders.recent ?? [];

  return (
    <div className="space-y-6" data-testid="profile-orders-panel">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Compras</h1>
        <p className="text-small text-muted-foreground">
          Consome Checkout / Orders via buyer dashboard.{" "}
          <Link href="/marketplace/orders" className="text-primary hover:underline">
            Ver todos os pedidos
          </Link>
        </p>
      </header>
      <GalleryFade className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileSummaryCard
          label="Pedidos"
          value={<GalleryCountUp to={data.orders.total} className="inline tabular-nums" />}
          href="/marketplace/orders"
          icon={ShoppingBag}
        />
        <ProfileSummaryCard
          label="Em trânsito / andamento"
          value={<GalleryCountUp to={inTransit.length} className="inline tabular-nums" />}
          icon={Truck}
        />
        <ProfileSummaryCard
          label="Economia obtida"
          value={formatCurrency((data.savings_cents ?? 0) / 100, "BRL")}
          icon={Package}
          tone="up"
        />
        <ProfileSummaryCard
          label="Lojas favoritas"
          value={
            <GalleryCountUp
              to={data.favorite_stores?.length ?? 0}
              className="inline tabular-nums"
            />
          }
          href="/perfil/favoritos"
          icon={Heart}
        />
      </GalleryFade>

      <GalleryFade className="space-y-2">
        <h2 className="text-sm font-medium">Últimos pedidos</h2>
        {recent.length === 0 ? (
          <p className="text-small text-muted-foreground">Nenhum pedido recente.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {recent.slice(0, 8).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <Link
                    href={`/marketplace/orders/${o.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {o.store_name || "Pedido"}
                  </Link>
                  <p className="text-caption text-muted-foreground">
                    {o.status || "—"}
                    {o.created_at
                      ? ` · ${new Date(o.created_at).toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                </div>
                <span>{formatCurrency((o.total_cents ?? 0) / 100, "BRL")}</span>
              </li>
            ))}
          </ul>
        )}
      </GalleryFade>

      {data.favorite_stores?.length ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Lojas favoritas</h2>
          <ul className="flex flex-wrap gap-2">
            {data.favorite_stores.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/loja/${s.slug}`}
                  className="rounded-md border border-border px-2.5 py-1 text-small hover:border-primary/40"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
