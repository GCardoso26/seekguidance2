"use client";

import Link from "next/link";
import {
  Gem,
  Heart,
  Layers,
  Package,
  Repeat2,
  Sparkles,
  Wallet,
} from "lucide-react";
import { CollectionGameProgress } from "@/components/collection-v2/CollectionGameProgress";
import { CollectionSummaryCard } from "@/components/collection-v2/CollectionSummaryCard";
import { CollectionTimeline } from "@/components/collection-v2/CollectionTimeline";
import { CollectionValueChart } from "@/components/collection-v2/CollectionValueChart";
import { CollectionLiveStrip } from "@/components/live-data/CollectionLiveStrip";
import { CollectionIntelligencePanel } from "@/components/intelligence/IntelligencePanels";
import { CollectionRecommendationPanel } from "@/components/recommendations/RecommendationPanels";
import { ContextualAssistantStrip } from "@/components/ai-assistants/ContextualAssistantStrip";
import { SharePlayerArtifactButton } from "@/components/social/SharePlayerArtifactButton";
import { stubCollectionAssistant } from "@/lib/ai-assistants/interfaces";
import { useCollectionInsights } from "@/hooks/useCollectionInsights";
import { useWishlist } from "@/hooks/useWishlist";
import { formatCurrency } from "@/lib/format-currency";
import { Skeleton } from "@/components/ui/skeleton";

function toneForChange(v: number | null): "default" | "up" | "down" {
  if (v == null || v === 0) return "default";
  return v > 0 ? "up" : "down";
}

function formatChange(value: number | null, pct: number | null, currency: string): string {
  if (value == null) return "Dados insuficientes";
  const sign = value > 0 ? "+" : "";
  const money = `${sign}${formatCurrency(value, currency)}`;
  if (pct == null) return money;
  return `${money} (${sign}${pct.toFixed(1)}%)`;
}

export function CollectionDashboard() {
  const { data, isLoading, isError, error } = useCollectionInsights();
  const { data: wishlist } = useWishlist();
  const wishlistCount = wishlist?.items?.length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="collection-dashboard-skeleton">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    const login = error instanceof Error && error.message === "login_required";
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <h1 className="text-xl font-semibold">Minha Coleção</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {login ? "Entre para ver o dashboard da coleção." : "Não foi possível carregar insights."}
        </p>
        {login && (
          <Link href="/entrar?next=/colecao" className="mt-4 inline-block text-primary hover:underline">
            Entrar
          </Link>
        )}
      </div>
    );
  }

  if (!data) return null;

  const currency = data.currency || "BRL";

  return (
    <div className="space-y-10" data-testid="collection-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CollectionLiveStrip />
      </div>
      <CollectionIntelligencePanel />
      <ContextualAssistantStrip
        surface="collection"
        load={() => stubCollectionAssistant.completeSetBudget({})}
      />
      <div className="flex flex-wrap gap-2">
        <SharePlayerArtifactButton kind="collection" />
        <SharePlayerArtifactButton kind="wishlist" />
        <SharePlayerArtifactButton kind="progress" />
        <SharePlayerArtifactButton kind="achievements" />
      </div>
      <CollectionRecommendationPanel />
      <header className="space-y-2">
        <h1 className="text-display text-foreground sm:text-3xl">Minha Coleção</h1>
        <p className="text-small text-muted-foreground">
          Biblioteca viva — valor, progresso por jogo e descoberta. Atualizado{" "}
          {new Date(data.updatedAt).toLocaleString("pt-BR")}.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CollectionSummaryCard
          label="Valor total"
          value={data.totalValue != null ? formatCurrency(data.totalValue, currency) : "—"}
          hint="Via Catalog / Pricing públicos"
          icon={Wallet}
        />
        <CollectionSummaryCard
          label="Variação 7 dias"
          value={formatChange(data.valueChange7d, data.valueChange7dPct, currency)}
          tone={toneForChange(data.valueChange7d)}
        />
        <CollectionSummaryCard
          label="Variação 30 dias"
          value={formatChange(data.valueChange30d, data.valueChange30dPct, currency)}
          tone={toneForChange(data.valueChange30d)}
        />
        <CollectionSummaryCard
          label="Cartas"
          value={String(data.totalCards)}
          hint={`${data.uniqueCards} únicas`}
          href="/colecao/cartas"
          icon={Layers}
        />
        <CollectionSummaryCard
          label="Duplicatas"
          value={String(data.duplicates)}
          href="/colecao/duplicatas"
          icon={Repeat2}
        />
        <CollectionSummaryCard
          label="Foil / Premium"
          value={`${data.foilCount} / ${data.premiumCount}`}
          icon={Sparkles}
        />
        <CollectionSummaryCard
          label="Wishlist"
          value={String(wishlistCount)}
          href="/colecao/wishlist"
          icon={Heart}
        />
        <CollectionSummaryCard
          label="Selados / Acessórios"
          value={`${data.sealedCount} / ${data.accessoryCount}`}
          hint="Em breve via Product Catalog"
          href="/loja"
          icon={Package}
        />
        <CollectionSummaryCard
          label="Liquidez média"
          value={
            data.avgLiquidity === "unknown"
              ? "—"
              : data.avgLiquidity === "high"
                ? "Alta"
                : data.avgLiquidity === "medium"
                  ? "Média"
                  : "Baixa"
          }
          icon={Gem}
        />
      </div>

      <CollectionValueChart
        series7d={data.series7d}
        series30d={data.series30d}
        series90d={data.series90d}
        series1y={data.series1y}
        currency={currency}
        insufficientHistory={data.insufficientHistory}
      />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-h3 text-foreground">Por jogo</h2>
          <Link href="/colecao/faltantes" className="text-small text-primary hover:underline">
            Ver faltantes
          </Link>
        </div>
        <CollectionGameProgress games={data.byGame} currency={currency} />
      </section>

      <CollectionTimeline acquisitions={data.recentAcquisitions} />
    </div>
  );
}
