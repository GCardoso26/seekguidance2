import type { SearchCardDocument, SearchResult } from "../../search/domain/SearchDocument.js";
import type { SearchSuggestHit } from "../../search/domain/SearchQueryService.js";
import type {
  CardDetailsResponse,
  CardSummaryResponse,
  SearchResultResponse,
  SetResponse,
  SuggestResponse,
  VariantResponse,
} from "../dto/responses.js";

export function toCardSummary(doc: SearchCardDocument): CardSummaryResponse {
  return {
    id: doc.id,
    name: doc.name,
    setCode: doc.setCode,
    setName: doc.setName,
    language: doc.language,
    rarity: doc.rarity,
    imageUrl: doc.imageUrl,
    priceMin: doc.priceMin,
    currency: doc.currency,
    hasStock: doc.hasStock,
  };
}

export function toCardDetails(doc: SearchCardDocument): CardDetailsResponse {
  return {
    ...toCardSummary(doc),
    oracleText: doc.oracleText,
    finishes: [...doc.finishes],
    storeIds: [...doc.storeIds],
    stockTotal: doc.stockTotal,
    priceMax: doc.priceMax,
    updatedAt: doc.updatedAt,
    projection: doc.projection,
  };
}

export function toVariant(doc: SearchCardDocument, finish: string): VariantResponse {
  return {
    id: `${doc.id}:${finish}`,
    cardId: doc.id,
    finish,
    language: doc.language,
    name: doc.name,
    setCode: doc.setCode,
    priceMin: doc.priceMin,
    currency: doc.currency,
    hasStock: doc.hasStock,
    imageUrl: doc.imageUrl,
  };
}

export function toSetResponse(input: {
  setCode: string;
  setName: string | null;
  cardCount: number;
}): SetResponse {
  return {
    id: input.setCode,
    code: input.setCode,
    name: input.setName,
    cardCount: input.cardCount,
  };
}

export function toSearchResult(
  result: SearchResult,
  query: string | null,
): SearchResultResponse {
  return {
    hits: result.hits.map((h) => ({
      card: toCardSummary(h.document),
      score: h.score,
    })),
    estimatedTotal: result.estimatedTotal,
    tookMs: result.tookMs,
    query,
    projection: result.projection,
  };
}

export function toSuggestResponse(q: string, hits: SearchSuggestHit[]): SuggestResponse {
  return {
    query: q,
    suggestions: hits.map((h) => ({
      id: h.id,
      name: h.name,
      setCode: h.setCode,
    })),
  };
}
