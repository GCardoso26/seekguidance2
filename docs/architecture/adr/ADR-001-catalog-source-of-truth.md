# ADR-001 — Catalog é Source of Truth

**Status:** Accepted  
**Data:** 2026-07-16  
**Tags:** catalog, sot, marketplace

## Context

Em marketplaces de TCG, lojistas frequentemente “corrigem” nome, texto, imagem ou legalidade. Isso polui o catálogo oficial e gera inconsistência entre busca, preços e anúncios.

## Decision

**Catalog** é a única fonte dos dados oficiais da carta (nome, oracle, set, variantes oficiais, legalidade, mappings de provider).  
Nenhum outro domínio pode mutar `catalog.*` fora do fluxo Catalog (Application Service + Outbox).

## Consequences

- Sync de provider **sempre vence** campos oficiais.
- Marketplace, Search e Analytics são consumidores / projeções.
- Exceções de SoT por tipo de dado estão em `DOMAIN_ORIENTED_PLATFORM.md` §2.
- Violações desta ADR exigem novo ADR explícito — não hotfixes silenciosos.
