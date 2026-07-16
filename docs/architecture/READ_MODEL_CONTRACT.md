# Read Model Contract — Public Read API

**Status:** Congelado — Sprint 3.5  
**Versão de API:** `/api/v1/`

## Três princípios

1. **Catalog nunca é consultado pela UI** (nem por controllers públicos).
2. **Toda leitura pública passa pela Search Projection.**
3. **A Public Read API é a única porta de entrada para consultas** de produto (FE, SEO, SDKs, Marketplace futuro).

## Cadeia obrigatória

```text
Client
  → GET /api/v1/*
  → SearchQueryService
  → SearchProjectionRepository
  → Meilisearch (cards_vN)
```

**Proibido:**

```text
Controller → Catalog Repository
Controller → Provider
Controller → Postgres catalog.*
```

## Contrato `SearchQueryService` (estável)

| Método | Uso |
|--------|-----|
| `search(query)` | Busca + filtros |
| `getCard(cardId)` | Detalhe de carta |
| `getVariant(variantId)` | Variante (finish) |
| `getSet(setId)` | Coleção / set |
| `suggest(query)` | Autocomplete |

Expandir só com **métodos novos** ou campos opcionais em DTOs. Não quebrar assinaturas.

## DTOs públicos (nunca entidades internas)

- `CardSummaryResponse`
- `CardDetailsResponse`
- `SearchResultResponse`
- `SetResponse`
- `VariantResponse`

`CatalogCard` / domínio interno **não** serializam direto para JSON.

## Versionamento

Todo endpoint público nasce sob `/api/v1/`.  
`v2` só quando houver breaking change consciente.

## Cache HTTP

Respostas de leitura carregam `ETag`, `Cache-Control`, `Last-Modified` desde o dia 1.

## Fora de escopo (bloqueado nesta superfície)

Login · JWT · Marketplace · Checkout · Stripe · KYC · Sellers · Listings · Analytics · IA · qualquer POST/PUT/PATCH/DELETE.
