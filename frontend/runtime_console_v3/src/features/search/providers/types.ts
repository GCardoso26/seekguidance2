import type { SearchContext, SearchResult } from "@/features/search/types";

export interface SearchProvider {
  id: string;
  priority: number;
  enabled: (ctx: SearchContext) => boolean;
  search: (query: string, ctx: SearchContext, signal: AbortSignal) => Promise<SearchResult[]>;
}
