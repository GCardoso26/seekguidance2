# RC1.1 Commit Report

**Data:** 2026-07-14  
**Message:** `feat(release): RC1.1 Store Performance Recovery`  
**Hash:** `1827ff7cba2b293dfd09e695fef8b7ea8ac580ce`  
**Parent:** `e10ff44368a3b7682a6a8dd253b73a315e3d0507`

## Escopo

Store Performance Recovery: logos WebP, grid RSC, `StoreProviders`, docs RC1.1 / Sprint 18–19.

## Stats

- **113 files** changed  
- **+2790 / −20088** (principalmente SVG logos reduzidos + webp)

## Incluído (amostra)

- `public/logos/*.webp` + SVG otimizados  
- `GameGridRsc`, `StoreProviders`, layouts de rotas  
- Docs `STORE_*`, `SHARED_BUNDLE_ANALYSIS`, scorecards S18/S19  
- Context `rc1-store-performance-recovery`, `sprint18-*`, `sprint19-*`

## Excluído (propositadamente)

- Fixes RC1.2 (tokens warning, analytics/catalog soft-200, audits A11y/BP)  
- Artefatos `.cursor`, `node_modules`, caches, LH HTML brutos não listados  
- Secrets / `.env`

## Verificação

| Check | Status |
|---|---|
| Sem merge conflict | PASS |
| Mensagem conforme brief | PASS |
| Sem accidental secrets | PASS |
| Branch | `main` (ahead 1) |
