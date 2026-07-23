"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  buildCollectionIntelligence,
  buildDeckIntelligence,
  buildMarketplaceSellerIntelligence,
  type IntelligenceInsight,
} from "@/lib/intelligence/providers";
import { cn } from "@/lib/utils";

function InsightGrid({
  title,
  items,
  testId,
}: {
  title: string;
  items: IntelligenceInsight[];
  testId: string;
}) {
  return (
    <section className="space-y-3" data-testid={testId}>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "rounded-xl border border-border bg-card/50 p-4",
              item.tone === "up" && "border-emerald-500/30",
              item.tone === "down" && "border-rose-500/30",
              item.tone === "action" && "border-primary/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              {item.metric ? (
                <span className="shrink-0 text-base font-bold text-primary">{item.metric}</span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            {item.href ? (
              <Link
                href={item.href}
                className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
              >
                {item.ctaLabel ?? "Abrir"} →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CollectionIntelligencePanel() {
  const enabled = isFeatureEnabled("INTELLIGENCE_PLATFORM");
  const { data = [] } = useQuery({
    queryKey: ["intel-collection"],
    queryFn: buildCollectionIntelligence,
    enabled,
    staleTime: 60_000,
  });
  if (!enabled) return null;
  return <InsightGrid title="Collection Intelligence" items={data} testId="collection-intelligence" />;
}

export function DeckIntelligencePanel({ deckId }: { deckId: string }) {
  const enabled = isFeatureEnabled("INTELLIGENCE_PLATFORM");
  const { data = [] } = useQuery({
    queryKey: ["intel-deck", deckId],
    queryFn: () => buildDeckIntelligence(deckId),
    enabled,
    staleTime: 60_000,
  });
  if (!enabled) return null;
  return <InsightGrid title="Deck Intelligence" items={data} testId="deck-intelligence" />;
}

export function MarketplaceSellerIntelligencePanel() {
  const enabled = isFeatureEnabled("INTELLIGENCE_PLATFORM");
  const { data = [] } = useQuery({
    queryKey: ["intel-seller-mkt"],
    queryFn: buildMarketplaceSellerIntelligence,
    enabled,
    staleTime: 60_000,
  });
  if (!enabled) return null;
  return (
    <InsightGrid title="Marketplace Intelligence" items={data} testId="marketplace-seller-intelligence" />
  );
}
