"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { fetchPublicDecks } from "@/lib/live-data/fetchers";
import { formatCurrency } from "@/lib/format-currency";
import { cn } from "@/lib/utils";
import type { PriceHistoryPoint } from "@/types/card";

type Props = {
  cardId: string;
  cardName?: string;
  gameId?: string;
  popularity?: number | null;
  priceTrend7d?: number | null;
  className?: string;
};

function spark(pts?: PriceHistoryPoint[] | null) {
  if (!pts?.length) return null;
  const first = pts[0]?.price;
  const last = pts[pts.length - 1]?.price;
  if (first == null || last == null || first === 0) return null;
  return ((last - first) / first) * 100;
}

/**
 * Painéis vivos na Universal Card Page — preço, meta, decks, torneios.
 */
export function CardLivePanels({
  cardId,
  cardName,
  gameId,
  popularity,
  priceTrend7d,
  className,
}: Props) {
  const h7 = usePriceHistory({ cardId, range: "7d" });
  const h30 = usePriceHistory({ cardId, range: "30d" });
  const h90 = usePriceHistory({ cardId, range: "90d" });

  const decksQ = useQuery({
    queryKey: ["card-live-decks", gameId],
    queryFn: () => fetchPublicDecks(4, gameId),
    enabled: Boolean(gameId),
    staleTime: 60_000,
  });

  const change7 = spark(h7.data) ?? priceTrend7d;
  const change30 = spark(h30.data);
  const change90 = spark(h90.data);

  return (
    <section className={cn("space-y-4", className)} data-testid="card-live-panels">
      <h2 className="text-lg font-semibold text-foreground">Ao vivo</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Preço mudou (7d)"
          value={fmtPct(change7)}
          tone={(change7 ?? 0) >= 0 ? "up" : "down"}
        />
        <Stat label="30 dias" value={fmtPct(change30)} tone={(change30 ?? 0) >= 0 ? "up" : "down"} />
        <Stat label="90 dias" value={fmtPct(change90)} tone={(change90 ?? 0) >= 0 ? "up" : "down"} />
        <Stat
          label="Popularidade"
          value={popularity != null ? `${Math.round(popularity)}` : "—"}
          tone="neutral"
        />
      </ul>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <h3 className="text-sm font-semibold">Decks recentes</h3>
          <ul className="mt-3 space-y-2">
            {(decksQ.data ?? []).map((d) => (
              <li key={d.id}>
                <Link href={`/decks/${d.id}`} className="text-sm text-primary hover:underline">
                  {d.name || d.title || "Deck"}
                </Link>
              </li>
            ))}
            {!decksQ.isLoading && !(decksQ.data ?? []).length && (
              <li className="text-sm text-muted-foreground">Sem decks públicos neste jogo</li>
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <h3 className="text-sm font-semibold">Torneios & meta</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {cardName
              ? `${cardName} — acompanhe aparições em eventos e decklists.`
              : "Acompanhe aparições em eventos e decklists."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/torneio" className="text-sm text-primary hover:underline">
              Tournament Hub →
            </Link>
            <Link href="/loja/tendencias" className="text-sm text-primary hover:underline">
              Tendências →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function fmtPct(v?: number | null) {
  if (v == null || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "up" | "down" | "neutral";
}) {
  return (
    <li className="rounded-xl border border-border bg-card/50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold",
          tone === "up" && "text-emerald-600",
          tone === "down" && "text-rose-600",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </p>
    </li>
  );
}

export function CardPriceSnapshot({
  price,
  currency,
}: {
  price?: number | null;
  currency?: string;
}) {
  if (price == null) return null;
  return (
    <p className="text-sm text-muted-foreground">
      Referência: {formatCurrency(price, currency || "BRL")}
    </p>
  );
}
