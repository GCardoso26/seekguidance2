# BUG_BACKLOG — Platform V4 QA Certification

**Campaign date:** 2026-07-22  
**Policy:** Find → document → reproduce → classify. No auto-fix in this campaign.  
**Evidence:** `testing/reports/qa-v4-certification-evidence.json`

---

## P0 — Blockers

### BUG-V4-001 — Catálogo mestre vazio em produção
- **Severidade:** P0  
- **Status:** **CLOSED** (2026-07-23) — `products=260` via sync manufacturers (`catalog:remediate-p0`).  
- **Residual:** sealed publishers ainda não full-sync nesta corrida; images CDN placeholder falham fetch.

### BUG-V4-002 — Scheduler / provider registry vazio
- **Severidade:** P0  
- **Status:** **CLOSED** (2026-07-23) — `provider_registry=89` + colunas `schedule_kind`/`next_run_at`.  
- Migration: `20260722240000_provider_registry_bootstrap_p0.sql`.

### BUG-V4-013 — Listagens marketplace sem vínculo ao catálogo mestre
- **Severidade:** P0  
- **Status:** **CLOSED** (path + sleeve link) — API shop retorna `master_product_id`; `MasterListingLinkService` linkou 1/1 sleeve.  
- **Nota:** 14877 `single` permanecem sem link (fora do escopo Product Catalog acessórios/selados).

---

## P1 — Must-fix before production

### BUG-V4-003 — Endpoints admin do Product Catalog sem autenticação
- **Status:** **CLOSED** (2026-07-23) — `Depends(require_admin)` + BFF exige sessão.

### BUG-V4-004 — GET knowledge-coverage escreve no banco
- **Status:** **CLOSED** (2026-07-23) — GET read-only; POST refresh + scheduler `refreshAndPersist`.

### BUG-V4-005 — Ausência de E2E/persona para Knowledge Graph
- **Status:** **CLOSED** (2026-07-23) — `product-knowledge-panel.spec.ts`.

### BUG-V4-009 — Serviços V4 sem wiring nos providers
- **Status:** **CLOSED** (2026-07-23) — `applyOfficialKnowledgeFromImport` no sync; Gamegenic sleeves populou contents/specs/metadata.

### BUG-V4-011 — Search boosts V4 sem teste de integração
- **Status:** **CLOSED** (2026-07-23) — `computeKnowledgeAffinityBoosts` + testes P1.

---

## P2

### BUG-V4-006 — `ProductAssetPackageService.upsertItem` sempre INSERT — **CLOSED**
- Fix: coluna `identity_key` + `ON CONFLICT (identity_key)`; migration `20260722250000_product_catalog_p2_uniques.sql`.

### BUG-V4-007 — Métrica `lifecycleCoverage` enganosa — **CLOSED**
- Fix: `AVAILABLE` conta como lifecycle válido (`pct(withLifecycle, products)`); TS + Python.

### BUG-V4-008 — `collections.code` sem UNIQUE — **CLOSED**
- Fix: `uq_collections_code` + upsert `ON CONFLICT (code)`.

### BUG-V4-012 — Empty state fraco no Knowledge Panel — **CLOSED**
- Fix: empty states unbound/empty no PDP + e2e.

---

## P3

### BUG-V4-010 — Tabelas `product_catalog` sem RLS — **CLOSED**
- Fix: RLS enable em todas as tabelas do schema + `REVOKE` de `anon`/`authenticated`/`PUBLIC`; zero policies client (deny-by-default).  
- Migration: `20260722260000_product_catalog_rls_p3.sql`.

---

## Resumo

| Sev | Abertos | Fechados |
|-----|---------|----------|
| P0 | **0** | 3 |
| P1 | **0** | 5 |
| P2 | **0** | 4 |
| P3 | **0** | 1 |

**Próximo:** expandir vínculos master + knowledge; revalidar Checkout/PDV/Lighthouse para reopen gate full.
