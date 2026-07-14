"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { MoverCardGrid } from "@/components/top-movers/TopMoversPanels";
import type { TopMoverCard } from "@/lib/top-movers/types";

/** Teaser client-safe para seções `"use client"` da home. */
export function TopMoversPlaceholder() {
  const [cards, setCards] = useState<TopMoverCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/runtime/top-movers?period=7d&sort=alta&limit=4")
      .then((r) => r.json())
      .then((data: { top_gainers?: TopMoverCard[] }) => {
        if (!cancelled) setCards(data.top_gainers?.slice(0, 4) ?? []);
      })
      .catch(() => {
        if (!cancelled) setCards([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Tendências do dia"
        description="Top Movers via Data Marts"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/loja/tendencias">Ver terminal →</Link>
          </Button>
        }
      />
      {loading ? <Skeleton className="h-48 w-full rounded-xl" /> : <MoverCardGrid title="" cards={cards} />}
    </div>
  );
}
