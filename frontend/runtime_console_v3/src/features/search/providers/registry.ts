import { sellerAiSearchProvider } from "@/features/search/providers/sellerAiSearchProvider";
import { cardSearchProvider } from "@/features/search/providers/cardSearchProvider";
import { judgeSearchProvider, rulesSearchProvider } from "@/features/search/providers/rulesSearchProvider";
import { navigationSearchProvider } from "@/features/search/providers/navigationSearchProvider";
import { sellerSearchProvider } from "@/features/search/providers/sellerSearchProvider";
import { ticketSearchProvider } from "@/features/search/providers/ticketSearchProvider";
import type { SearchProvider } from "@/features/search/providers/types";

export const ALL_SEARCH_PROVIDERS: SearchProvider[] = [
  cardSearchProvider,
  sellerSearchProvider,
  ticketSearchProvider,
  navigationSearchProvider,
  rulesSearchProvider,
  judgeSearchProvider,
].sort((a, b) => b.priority - a.priority);

export function getActiveProviders(
  providers: SearchProvider[],
  ctx: import("@/features/search/types").SearchContext,
): SearchProvider[] {
  return providers.filter((p) => p.enabled(ctx));
}
