"use client";

import Link from "next/link";
import {
  Bell,
  Heart,
  Layers,
  Package,
  ShoppingCart,
  Sparkles,
  Store,
  Wallet,
} from "lucide-react";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { useBuyerDashboard, useBuyerInsights } from "@/hooks/useBuyerExperience";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { SkipToMain } from "@/components/a11y/SkipToMain";
import { Surface } from "@/components/ui/surface";

function StatCard({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  href: string;
  icon: typeof Package;
}) {
  return (
    <Link href={href} className="block">
      <Surface variant="interactive" padding="sm" className="group">
        <div className="flex items-center justify-between">
          <span className="section-title">{label}</span>
          <Icon className="h-4 w-4 text-primary opacity-80" aria-hidden />
        </div>
        <p className="mt-2 text-h3 font-semibold tracking-tight text-foreground group-hover:text-primary">{value}</p>
      </Surface>
    </Link>
  );
}

export function BuyerDashboardPage() {
  const { user, loading: authLoading } = useJudgeAuth();
  const { data, isLoading, error } = useBuyerDashboard();
  const { data: insights } = useBuyerInsights();

  if (!authLoading && !user) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center" data-testid="buyer-dashboard-login">
        <h1 className="text-xl font-semibold">Painel do comprador</h1>
        <p className="mt-2 text-sm text-muted-foreground">Entre para ver pedidos, wishlist, coleção e oportunidades.</p>
        <Button asChild className="mt-6">
          <Link href="/entrar?next=/comprador">Entrar</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-[70vh] space-y-8" aria-busy="true" data-testid="buyer-dashboard-loading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-72 animate-pulse rounded bg-muted/40" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted/40" />
            <div className="h-9 w-36 animate-pulse rounded-md bg-muted/40" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-56 animate-pulse rounded-xl bg-muted/40" />
          <div className="h-56 animate-pulse rounded-xl bg-muted/40" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-small text-danger">Não foi possível carregar o painel.</p>;
  }

  const topInsights = (insights?.insights ?? []).slice(0, 3);

  return (
    <div className="space-y-8" id="main-content" data-testid="buyer-dashboard">
      <SkipToMain />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedidos, wishlist, coleção e oportunidades — a plataforma trabalha a seu favor.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/carrinho">Carrinho</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/loja">Continuar comprando</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo">
        <StatCard
          label="Pedidos em andamento"
          value={String(data.orders.in_progress.length)}
          href="/marketplace/orders"
          icon={Package}
        />
        <StatCard
          label="Wishlist"
          value={String(data.wishlist.total)}
          href="/wishlist"
          icon={Heart}
        />
        <StatCard
          label="Coleção"
          value={`${data.collection.unique_cards} cartas`}
          href="/colecao"
          icon={Layers}
        />
        <StatCard
          label="Economia"
          value={formatShopPrice(data.savings_cents)}
          href="/marketplace/orders"
          icon={Wallet}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Pedidos recentes</h2>
            <Link href="/marketplace/orders" className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {data.orders.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
          ) : (
            <ul className="space-y-2">
              {data.orders.recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/marketplace/orders/${o.id}`}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted/60"
                  >
                    <span className="font-mono text-xs">#{o.id.slice(0, 8)}</span>
                    <span className="text-xs uppercase text-muted-foreground">{o.status}</span>
                    <span className="text-sm font-medium">{formatShopPrice(o.total_cents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="font-semibold">Assistente do comprador</h2>
          </div>
          <p className="text-sm text-muted-foreground">{insights?.summary ?? "Carregando oportunidades…"}</p>
          <ul className="mt-3 space-y-2">
            {topInsights.map((ins, idx) => (
              <li key={`${ins.type}-${idx}`} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{ins.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{ins.description}</p>
                {ins.cta && (
                  <Link
                    href={ins.cta.href}
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                    onClick={() =>
                      void trackEvent("buyer_insight_click", {
                        type: ins.type,
                        href: ins.cta?.href,
                      })
                    }
                  >
                    {ins.cta.label} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-caption text-muted-foreground/80">
            Nunca compramos automaticamente. Sempre sugerimos.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Store className="h-4 w-4" aria-hidden />
              Lojas favoritas
            </h2>
          </div>
          {data.favorite_stores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Compre em lojas para montar seus favoritos.</p>
          ) : (
            <ul className="space-y-2">
              {data.favorite_stores.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/marketplace/loja/${s.slug}`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted"
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Trust {Math.round(s.trust_score ?? 75)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recomendados para você</h2>
            <Link href="/wishlist" className="text-xs text-primary hover:underline">
              Wishlist
            </Link>
          </div>
          {data.recommended.length === 0 ? (
            <p className="text-sm text-muted-foreground">Explore o marketplace para personalizar.</p>
          ) : (
            <ul className="space-y-2">
              {data.recommended.slice(0, 5).map((p) => (
                <li key={p.product_id}>
                  <Link
                    href={p.href}
                    className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted"
                    onClick={() =>
                      void trackEvent("recommendation_click", {
                        product_id: p.product_id,
                        source: "buyer_dashboard",
                      })
                    }
                  >
                    <span className="truncate pr-2 text-sm">{p.name}</span>
                    <span className="shrink-0 text-sm text-primary">
                      {formatShopPrice(p.price_cents)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/wishlist/alerts">
            <Bell className="mr-2 h-4 w-4" />
            Alertas ({data.alerts.active})
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/notifications">Notificações</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/carrinho">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Carrinho ({data.cart.item_count})
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/decks">Decks</Link>
        </Button>
      </section>
    </div>
  );
}
