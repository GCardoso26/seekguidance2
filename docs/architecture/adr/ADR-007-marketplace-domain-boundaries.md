# ADR-007 — Marketplace Domain Boundaries

**Status:** Accepted  
**Data:** 2026-07-16  
**Tags:** marketplace, bounded-context, catalog, overlay, orders  
**Relaciona:** ADR-001 (Catalog SoT), ADR-003 (Overlay), ADR-005 (AS por Aggregate)

## Context

A partir da Sprint 4 surgem conceitos de **domínio de produto** (não mais só infraestrutura). Sem fronteiras explícitas, Seller/Inventory/Listing/Order tendem a virar uma tabela gorda acoplada ao Catalog e ao índice de busca.

## Decision

O Marketplace é dividido em **quatro agregados**, nesta ordem de dependência:

```text
Seller → Inventory → Listing → Order
```

| Aggregate | Responsável por | NÃO contém |
|-----------|-----------------|------------|
| **Seller** | quem vende (status, verification, configuration) | anúncios, pedidos |
| **Inventory** | quantas cartas existem (`InventoryItem`) | preço |
| **Listing** | quanto custa (preço, condição, idioma, notas) | dados oficiais (nome/oracle/artista) |
| **Order** | compra (Sprint 5 — **não antes**) | — |

### Regras invioláveis

1. **Catalog é imutável para o Marketplace.** Nunca escreve `catalog.*`.
2. **Listing referencia, nunca copia.** Só guarda `catalogCardId` / `catalogVariantId`.
   - Proibido: `listing.name`, `listing.oracle`, `listing.artist`. Esses campos são do Catalog.
3. **Nenhuma FK para Meilisearch.** Tudo aponta para **Catalog IDs**.
4. **RenderedCard é read model** (Catalog/Search + overlay do Listing), montado na borda (FE/BFF) — nunca gravado de volta.
5. **Order não existe na Sprint 4.**

```text
Catalog (imutável / SoT)
    ↓  referência
Marketplace (overlay: preço, estoque, condição, fotos)
    ↓
Order (Sprint 5)
```

## Consequences

- Cada aggregate tem seu Repository Port + Application Service (ADR-005).
- `MarketplaceListingUpdated` é o único evento que sai do Marketplace para o Search (via Outbox — ADR-004), carregando apenas IDs + preço/estoque/finish.
- A UI compõe: Search (oficial) + Marketplace (ofertas) → RenderedCard. O backend não funde os dois no SoT.
- Raiz de API separada: `/api/v1/marketplace` (nunca misturar com `/api/v1/search`).
