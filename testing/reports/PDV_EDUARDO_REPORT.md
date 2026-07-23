# PDV — Persona Eduardo (Search)

**Persona:** Eduardo Lima — Search Specialist  
**Fonte:** `persona-eduardo-search-latest.json` (2026-07-22T21:13:53Z)

## Veredito Eduardo

Busca de catálogo/API: **PASS** (searchScore 85, confidence 98%).  
Buscas do painel/PDV (pedidos, clientes, SKU no balcão): **Não comprovado**.

## Evidências automatizadas

- Unit: `feGameConfig` true, `apiProjection` true  
- 13 queries HTTP 200 (Rapunzel, Merlin, charizard, etc.) — latências ~209–324 ms  
- Facets / synonyms: notas de validação parcial / browser

## Checklist do brief

| Item | Status |
| --- | --- |
| Busca de produtos (API/marketplace) | PASS |
| Busca do painel | **Não comprovado** |
| Busca por pedidos | **Não comprovado** |
| Busca por clientes | **Não comprovado** |
| Busca por SKU (PDV) | **Não comprovado** (E2E PDV abortou antes da busca útil) |
| Busca por cartas | PASS parcial (queries de nomes) |
| Filtros | Parcial (Renato filters workload OK; facets browser **Não comprovado**) |
| Autocomplete | **Não comprovado** |
| Tempo de resposta (search API) | PASS (p95 ~245 ms nas amostras Eduardo/Renato search) |

## Bugs

Nenhum P0–P3 novo no JSON da persona.

## Melhorias sugeridas (Eduardo)

1. E2E de busca PDV por SKU/nome com produto seedado.
2. Smoke de busca de pedidos/clientes no painel.
3. Validar facets no browser na campanha média.

## Conclusão

Search de catálogo está sólido nas evidências. Search operacional do lojista no PDV/painel: **Não comprovado**.
