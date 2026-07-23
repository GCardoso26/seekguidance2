"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  defaultCollectionAdvisor,
  defaultDeckAdvisor,
  defaultMarketplaceAdvisor,
  defaultMetaAdvisor,
  defaultPriceAdvisor,
  defaultRecommendationProvider,
  type RecommendationItem,
} from "@/lib/recommendations/providers";
import { cn } from "@/lib/utils";

function PanelShell({
  title,
  items,
  className,
  testId,
}: {
  title: string;
  items: RecommendationItem[];
  className?: string;
  testId?: string;
}) {
  if (!items.length) return null;
  return (
    <aside
      className={cn(
        "rounded-xl border border-border/80 bg-card/50 p-4",
        className,
      )}
      data-testid={testId}
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="text-sm">
            <p className="font-medium text-foreground">{item.title}</p>
            <p className="mt-0.5 text-muted-foreground">{item.detail}</p>
            {item.href ? (
              <Link
                href={item.href}
                className="mt-1 inline-flex text-xs font-medium text-primary hover:underline"
              >
                {item.ctaLabel ?? "Abrir"} →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function CollectionRecommendationPanel({ className }: { className?: string }) {
  const { data = [] } = useQuery({
    queryKey: ["rec-collection"],
    queryFn: () => defaultCollectionAdvisor.advise({}),
    staleTime: 60_000,
  });
  return (
    <PanelShell
      title="Para a sua coleção"
      items={data}
      className={className}
      testId="rec-collection-panel"
    />
  );
}

export function DeckRecommendationPanel({
  deckId,
  className,
}: {
  deckId: string;
  className?: string;
}) {
  const { data = [] } = useQuery({
    queryKey: ["rec-deck", deckId],
    queryFn: () => defaultDeckAdvisor.advise({ deckId }),
    staleTime: 60_000,
  });
  return (
    <PanelShell
      title="Completar este deck"
      items={data}
      className={className}
      testId="rec-deck-panel"
    />
  );
}

export function MarketplaceRecommendationPanel({ className }: { className?: string }) {
  const { data = [] } = useQuery({
    queryKey: ["rec-marketplace"],
    queryFn: () => defaultMarketplaceAdvisor.advise({}),
    staleTime: 60_000,
  });
  return (
    <PanelShell
      title="Marketplace · para você"
      items={data}
      className={className}
      testId="rec-marketplace-panel"
    />
  );
}

export function ProfileRecommendationPanel({ className }: { className?: string }) {
  const { data = [] } = useQuery({
    queryKey: ["rec-profile"],
    queryFn: () => defaultRecommendationProvider.recommend({}),
    staleTime: 60_000,
  });
  return (
    <PanelShell
      title="Recomendações"
      items={data}
      className={className}
      testId="rec-profile-panel"
    />
  );
}

export function CardRecommendationPanel({
  cardId,
  className,
}: {
  cardId: string;
  className?: string;
}) {
  const { data = [] } = useQuery({
    queryKey: ["rec-card", cardId],
    queryFn: async () => {
      const [price, meta] = await Promise.all([
        defaultPriceAdvisor.advise({ cardId }),
        defaultMetaAdvisor.advise({ cardId }),
      ]);
      return [...price, ...meta];
    },
    staleTime: 60_000,
  });
  return (
    <PanelShell
      title="Vale a pena?"
      items={data}
      className={className}
      testId="rec-card-panel"
    />
  );
}
