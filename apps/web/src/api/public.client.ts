import type { HttpClient } from "@/src/api/client";
import type { CardDetails, SearchResult, VariantSummary } from "@/src/types/api";

export interface SearchParams {
  q?: string;
  name?: string;
  set?: string;
  language?: string;
  finish?: string;
  hasStock?: boolean;
  priceMin?: number;
  priceMax?: number;
  limit?: number;
  offset?: number;
}

export interface PublicApiClient {
  search(params?: SearchParams): Promise<SearchResult>;
  getCard(cardId: string): Promise<CardDetails>;
  listVariants(
    cardId: string,
    finish?: string,
  ): Promise<{ items: VariantSummary[] }>;
  suggest(q: string, limit?: number): Promise<{ suggestions: unknown[]; query: string }>;
}

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function createPublicApiClient(http: HttpClient): PublicApiClient {
  return {
    search(params = {}) {
      return http.get<SearchResult>(
        `/api/v1/search${toQuery({ ...params })}`,
        { auth: false },
      );
    },

    getCard(cardId) {
      return http.get<CardDetails>(`/api/v1/cards/${encodeURIComponent(cardId)}`, {
        auth: false,
      });
    },

    listVariants(cardId, finish) {
      return http.get<{ items: VariantSummary[] }>(
        `/api/v1/variants${toQuery({ cardId, finish })}`,
        { auth: false },
      );
    },

    suggest(q, limit = 8) {
      return http.get(`/api/v1/suggest${toQuery({ q, limit })}`, { auth: false });
    },
  };
}
