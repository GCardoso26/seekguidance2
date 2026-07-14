import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import type { TopMoverCard, TopMoversResponse } from "@/lib/top-movers/types";
import { cn } from "@/lib/utils";

function fmtMoney(n: number | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={cn("tabular-nums font-medium", up ? "text-success" : "text-danger")}>
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export function TopMoversHero({ data }: { data: TopMoversResponse }) {
  const s = data.summary ?? {};
  return (
    <header className="space-y-6 border-b border-border pb-8">
      <PageHeader
        level="display"
        title="Top Movers"
        description="Terminal do marketplace — altas, quedas, liquidez e volume a partir dos Data Marts."
        meta={
          <p className="text-caption text-muted-foreground">
            Fonte: {data.source} · Janela {data.window ?? "7d"}
            {data.query_ms != null ? ` · ${data.query_ms}ms` : ""}
          </p>
        }
        action={
          <Link href="/loja/busca" className="text-sm text-primary hover:underline">
            Ir à loja →
          </Link>
        }
      />
      <SectionHeader title="Mercado hoje" description="Resumo operacional do mercado" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <MetricCard label="Total negociado" value={fmtMoney(s.gmv)} hint="GMV (mart_orders)" />
        <MetricCard
          label="Maior alta"
          value={s.top_gainer ? <Delta value={s.top_gainer.delta_pct} /> : "—"}
          hint={s.top_gainer?.name}
          trend="up"
        />
        <MetricCard
          label="Maior queda"
          value={s.top_loser ? <Delta value={s.top_loser.delta_pct} /> : "—"}
          hint={s.top_loser?.name}
          trend="down"
        />
        <MetricCard label="Carta tendência" value={s.trending_card?.name ?? "—"} hint={s.trending_card?.set} />
        <MetricCard label="Volume" value={s.volume ?? "—"} hint="Unidades movimentadas" />
        <MetricCard
          label="Product Health"
          value={s.product_health_score != null ? Math.round(s.product_health_score) : "—"}
          hint="Score 0–100"
        />
      </div>
    </header>
  );
}

export function MoverCard({ card }: { card: TopMoverCard }) {
  return (
    <Card className="group overflow-hidden border-border/70 transition hover:border-primary/40 hover:shadow-card-hover">
      <CardContent className="space-y-3 p-4">
        <div className="aspect-[63/88] rounded-md bg-muted/50" aria-hidden />
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{card.game}</Badge>
          {card.foil ? <Badge>Foil</Badge> : null}
          {card.badge === "hot" ? <Badge variant="danger">Hot</Badge> : null}
        </div>
        <div>
          <p className="truncate font-medium text-foreground">{card.name}</p>
          <p className="truncate text-caption text-muted-foreground">{card.set}</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold tabular-nums">{fmtMoney(card.price)}</span>
          <Delta value={card.delta_pct} />
        </div>
        <dl className="grid grid-cols-2 gap-1 text-caption text-muted-foreground">
          <div>
            Liq. <span className="text-foreground">{(card.liquidity * 100).toFixed(0)}%</span>
          </div>
          <div>
            Vol. <span className="text-foreground">{card.volume}</span>
          </div>
          <div>
            Qtd. <span className="text-foreground">{card.listed_qty}</span>
          </div>
          <div>
            Spread <span className="text-foreground">{(card.spread * 100).toFixed(1)}%</span>
          </div>
        </dl>
        <Link
          href={`/loja/busca?q=${encodeURIComponent(card.name)}`}
          className="inline-block text-xs text-primary opacity-90 hover:underline group-hover:opacity-100"
        >
          Ver na loja →
        </Link>
      </CardContent>
    </Card>
  );
}

export function MoverCardGrid({ title, description, cards }: { title: string; description?: string; cards: TopMoverCard[] }) {
  if (!cards.length) return null;
  return (
    <section className="space-y-3">
      {title ? <SectionHeader title={title} description={description} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <MoverCard key={`${title || "mover"}-${c.card_id}`} card={c} />
        ))}
      </div>
    </section>
  );
}

export function TopMoversInsights({ insights }: { insights: string[] }) {
  if (!insights.length) return null;
  return (
    <aside className="surface-card space-y-3 rounded-xl border border-border p-5" aria-label="Insights de mercado">
      <SectionHeader title="Insights" description="Somente leitura · derivados dos marts" />
      <ul className="space-y-2">
        {insights.map((line) => (
          <li key={line} className="text-small text-muted-foreground">
            • {line}
          </li>
        ))}
      </ul>
    </aside>
  );
}
