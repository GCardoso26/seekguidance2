import type { SearchProjectionRepository } from "../domain/SearchProjectionRepository.js";
import type { SearchCardDocument, SearchResult } from "../domain/SearchDocument.js";
import type {
  SearchQuery,
  SearchQueryService,
  SearchSuggestHit,
} from "../domain/SearchQueryService.js";
import { searchQueryToFilters } from "../domain/SearchQueryService.js";

/**
 * Read-only query facade over Search projection (never Catalog).
 */
export class ProjectionSearchQueryService implements SearchQueryService {
  constructor(private readonly projection: SearchProjectionRepository) {}

  search(query: SearchQuery): Promise<SearchResult> {
    return this.projection.search(searchQueryToFilters(query));
  }

  getCard(cardId: string): Promise<SearchCardDocument | null> {
    return this.projection.get(cardId);
  }

  async getVariant(variantId: string): Promise<SearchCardDocument | null> {
    const sep = variantId.lastIndexOf(":");
    if (sep <= 0) return null;
    const cardId = variantId.slice(0, sep);
    const finish = variantId.slice(sep + 1);
    const card = await this.projection.get(cardId);
    if (!card) return null;
    if (!card.finishes.map((f) => f.toLowerCase()).includes(finish.toLowerCase())) {
      return null;
    }
    return card;
  }

  async getSet(
    setId: string,
  ): Promise<{ setCode: string; setName: string | null; cardCount: number } | null> {
    const result = await this.projection.search({
      setCode: setId.toUpperCase(),
      limit: 1,
    });
    if (result.estimatedTotal === 0) return null;
    const first = result.hits[0]?.document;
    return {
      setCode: setId.toUpperCase(),
      setName: first?.setName ?? null,
      cardCount: result.estimatedTotal,
    };
  }

  async suggest(query: string, limit = 8): Promise<SearchSuggestHit[]> {
    const result = await this.projection.search({ q: query, limit });
    return result.hits.map((h) => ({
      id: h.document.id,
      name: h.document.name,
      setCode: h.document.setCode,
    }));
  }
}
