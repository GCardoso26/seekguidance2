# TOP_MOVERS_UI.md

**Version:** 1.0.0 · **Route:** `/loja/tendencias`

## Layout

Hero (MetricCards) → Filtros island → Altas / Baixas / Pesquisadas / Vendidas / Liquidez → Tabela → Insights

## DS v3

PageContainer, PageHeader, SectionHeader, MetricCard, Card, Button, Badge, Tabs (filtros via Button), Skeleton, EmptyState, DataTable

## Islands

- `TopMoversFiltersIsland` (client)
- `TopMoversTableIsland` (client)

RSC body: `app/loja/tendencias/page.tsx`
