# Eduardo Lima — Search Specialist

**Cargo:** Search Specialist  
**Pergunta:** A busca encontra a carta certa, rápido, com typos e sinônimos?  
**Não valida:** checkout, seller onboarding.

## Queries de referência (campanha)

Rapunzel · Rap · RaPun · Rapunzel Gifted · gifted · Merlin · Dragon · Charizard · Pikachu · Black Lotus · Sol Ring · Be Prepared · Diablo · …

## Valida

Ranking · typo tolerance · synonyms · facets · language · ordering · latency

## Relatório

Search Score · queries (pass/fail/latency) · facet bugs · synonym gaps

## Automação

- Unit: `gameConfig.r2`, synonyms, ranking (FE)
- HTTP batch (se `BASE_URL` up): `testing/personas/runners/eduardo-search-audit.mjs`

## Pré-requisito

Search/OpenSearch ou HTTP search OK no Environment Audit.
