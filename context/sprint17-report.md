# Sprint 17 Report — Inventory Management Platform (MVP)

**Data:** 2026-07-13  
**Escopo:** Opção 1 — MVP utilizável dos 14 épicos  
**RC1:** não iniciado (conforme brief)

## Arquitetura
UI → BFF (`/api/seller/inventory/*`) → Application Services (`seller_inventory_*.py`) → módulos marketplace existentes (`card_listings`, `shop_products`, `shop_inventory`). Sem Aggregate/Outbox novos.

## Arquivos criados (principais)
### API
- `services/api/app/marketplace/seller_inventory_dashboard.py`
- `services/api/app/marketplace/seller_inventory_health.py`
- `services/api/app/marketplace/seller_inventory_analytics.py`
- `services/api/app/marketplace/seller_inventory_export.py`
- `services/api/app/marketplace/seller_inventory_bulk.py`
- (já existente evolvido) `seller_inventory_search.py`

### BFF
- `dashboard`, `analytics`, `export`, `bulk`, `import-csv` sob `api/seller/inventory/`

### UI
- `InventoryDashboardStrip`, `InventoryDataTable`, `InventoryImportWizard`, `InventoryExportMenu`
- `inventorySearchProvider`

### Docs
- `docs/frontend/INVENTORY_*.md`
- este relatório

## Arquivos alterados
- `seller_dashboard_api.py` (rotas inventory)
- `shop_inventory.py` (dry_run)
- `card_listings.py` (availability/updatedAt buyer read fields)
- `inventory_context.py` (AI)
- `estoque/page.tsx`, `registry.ts`, `seller-sidebar-nav.ts`

## Quality Gates (evidência local)
| Gate | Resultado |
|---|---|
| Pytest inventory unit | **13 passed** (health + search + dashboard/export/bulk/analytics), smoke DB skipped sem `INVENTORY_SMOKE_TESTS` |
| `ds:audit` | **0 hits** |
| CI GitHub billing | Não exigido nesta sprint |

## Cobertura MVP por épico
1 Dashboard — sim  
2 Search — sim (localStorage filtros/histórico)  
3 Table ERP — sim (sem drag/resize)  
4 Multi-source — sim (campos derivados)  
5 Health — sim  
6 Intelligence — sugestões read-only  
7 Import — wizard + dry-run  
8 Export — CSV/JSON (XLSX deferred)  
9 Analytics — KPIs + trend 7d  
10 Search Platform — provider  
11 Buyer — availability/updatedAt no listing payload  
12 Seller AI — context estendido  
13 UX Premium — tokens  
14 Auditoria — docs + canvas + report  

## Próximos passos
- Persistência de sync history / import rollback
- XLSX, curva ABC, drag/resize colunas
- Sprint 18: exclusivamente RC1 com working tree limpa

## Go / No-Go RC1
**No-Go até commit desta sprint estar em `main` e tree limpa.** Após push, Sprint 18 pode iniciar RC1.
