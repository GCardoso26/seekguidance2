# ADR-003 — Marketplace usa Overlay (RenderedCard)

**Status:** Accepted  
**Data:** 2026-07-16  
**Tags:** marketplace, overlay, catalog

## Context

Sem overlay, o marketplace tende a sobrescrever o catálogo (títulos customizados, fotos de anúncio, notas do vendedor), corrompendo dados oficiais.

## Decision

**Marketplace nunca altera o Catalog.**  
Cria apenas **overlays** (`RenderedCard` = Catalog + overlay de listing).  
Preço/estoque/fotos do anúncio vivem em Marketplace (+ Media com `owner_type=listing`).

## Consequences

- Imagens oficiais: `owner_type=catalog_card` (Media).
- Imagens de anúncio: `owner_type=listing` — nunca apontam como oficiais do Catalog.
- Esta é a decisão **inviolável** de consistência do produto; ver também ADR-001.
