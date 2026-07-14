"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { CatalogSearchSkeleton } from "@/components/search/CatalogSearchSkeleton";

const FacetedSearch = dynamic(
  () => import("@/components/search/FacetedSearch").then((m) => m.FacetedSearch),
  {
    ssr: false,
    loading: () => <CatalogSearchSkeleton />,
  },
);

/** Island client: adia FacetedSearch para após o primeiro paint (LCP no H1 RSC). */
export function LojaBuscaClient() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const enable = () => setReady(true);
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const idleId = w.requestIdleCallback(enable, { timeout: 400 });
      return () => w.cancelIdleCallback?.(idleId);
    }
    const timeoutId = window.setTimeout(enable, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!ready) return <CatalogSearchSkeleton />;
  return <FacetedSearch searchBasePath="/loja/busca" cardDetailPath="/loja/cartas" />;
}
