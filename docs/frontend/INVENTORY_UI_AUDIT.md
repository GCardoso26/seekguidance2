# Inventory UI Audit — Sprint 17

Data: 2026-07-13

## Escopo
MVP dos 14 épicos da Inventory Management Platform em `/vendedor/painel/estoque`.

## Arquivos UI
- `components/seller-inventory/*` (DashboardStrip, DataTable, SearchPanel, KindTabs, ImportWizard, ExportMenu, types)
- `app/vendedor/painel/estoque/page.tsx`
- `features/search/providers/inventorySearchProvider.ts`

## Checklist DS v3
| Item | Status |
|---|---|
| Tokens semânticos | OK |
| Sem text-white / bg-black / luxury | OK (`ds:audit` 0 hits) |
| PageShell / SellerHeader | OK |
| Motion mínimo | Parcial (transições CSS) |

## Lacunas MVP
- Drag/resize de colunas
- Virtualização linha-a-linha dedicada (usa scroll + DataTable sticky)
- XLSX export
