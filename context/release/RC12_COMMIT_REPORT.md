# RC1.2 Commit Report

**Data:** 2026-07-14  
**Message:** `feat(release): RC1.2 Quality Gates Recovery`  
**Hash:** `0e61a2ce` (full: ver `git rev-parse HEAD` no momento do push)  
**Parent:** `1827ff7c` (RC1.1)

## Escopo

Quality Gates Recovery: contraste WCAG (warning), soft-degrade analytics/catalog (BP console), audits A11y/BP, source maps prod, docs RC1.2.

## Stats

- **27 files** changed  
- **+750 / −1485**

## Incluído

- `design-tokens.css` / `globals.css` — contraste  
- `/api/analytics/track`, `/api/catalog/sets`, `/api/catalog/cards/search` — HTTP 200 soft  
- `GlobalSearchBar`, `PriceTrendCard`, `TopMoversPlaceholder` — a11y  
- `next.config.mjs` — `productionBrowserSourceMaps` + headers  
- Docs audits + `QUALITY_GATES_HISTORY` + `PRODUCTION_VALIDATION`  
- `context/rc1-quality-gates-recovery.md`, `rc1-final-report.md`  
- `docs/release/RC1_BLOCKERS.md`, `RC1_READINESS.md`  
- `context/release/repository_state.md`, `RC11_COMMIT_REPORT.md`

## Excluído

- Artefatos LH HTML/JSON sob `lighthouse-reports/` (gitignore; `summary.json` já tracked atualizado)  
- `.cursor`, `node_modules`, secrets

## Verificação

| Check | Status |
|---|---|
| Mensagem conforme brief | PASS |
| Working tree após commit | clean (ahead 2) |
| Sem secrets | PASS |
