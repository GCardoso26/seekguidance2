# SEARCH_AUDIT.md

## Surfaces

Header autocomplete, `/loja/busca` facets, Top Movers, card/store/collection/player/tournament search entry points.

## Findings

| ID | Issue |
|----|-------|
| SEA-01 | GlobalSearchBar does not emit search analytics |
| SEA-02 | FacetedSearch `results_count` vs expected `result_count` — **funnel break** |
| SEA-03 | Track on total change can fire false zero-results while loading |
| SEA-04 | Weak zero-results guidance |
| PERF-01/02 | Cold Lighthouse / heavy client FacetedSearch |
| BUY-010 | Header search fail silent |
| ANA-03 | top_movers compare never fired |

## Persona notes

- **Buyer:** Search is primary discovery after Comprar CTA removal — must be reliable and measured.  
- **Seller/Player/Tournament:** Cross-entity search uneven; player/tournament paths less marketplace-grade than card search.

## Vs Cardmarket / ML

Worse on: analytics honesty, cold perf stability, error empty states. Comparable on: facet richness intent. Better TBD after PERF-01.

## Recommendations

Fix SEA-02 + SEA-01 before trusting Search KPI. Budget Lighthouse as release gate.
