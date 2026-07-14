"use client";

import dynamic from "next/dynamic";
import { CatalogSearchSkeleton } from "@/components/search/CatalogSearchSkeleton";

const FacetedSearch = dynamic(
  () => import("@/components/search/FacetedSearch").then((m) => m.FacetedSearch),
  {
    // SSR da island: H1 RSC + HTML parcial da busca ajudam LCP/SI
    loading: () => <CatalogSearchSkeleton />,
  },
);

/** Island client: facetas + grid — shell RSC em page.tsx. */
export function LojaBuscaClient() {
  return <FacetedSearch searchBasePath="/loja/busca" cardDetailPath="/loja/cartas" />;
}
