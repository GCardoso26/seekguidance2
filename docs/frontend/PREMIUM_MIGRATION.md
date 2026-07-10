# Premium Migration Report

**Data:** 2026-07-10 · UI-only

## Criado

| Artefato | Path |
|----------|------|
| Design tokens v3 | `src/styles/design-tokens.css` |
| Brand config | `src/lib/brand.ts` |
| Motion DS | `src/lib/motion.ts` |
| PageHeader canônico | `src/components/ui/page-header.tsx` |
| DS audit script | `scripts/ds-audit.js` (`npm run ds:audit`) |

## Tokens novos

- Neutral / Primary 50–900
- Success / Warning / Danger / Info scales
- `html[data-contrast="high"]`
- Typography clamp: display-xl → overline / button / table / code
- Motion: `--transition-*`, `--ease-out`
- Layout: `--page-gutter`, `--page-max`

## Componentes unificados / refinados

- `EmptyState` → `PageEmpty` (footer slot)
- `PageShell` → usa `ui/page-header` (level h2)
- `Toast` → tokens success/danger/warning/info
- `CatalogMarketplaceSection` → `showHero` / `showGames`
- Marketplace landing — tipografia tokens, sem emoji sections
- SellerProfileHeader — premium (subagent)
- MobileLayout — safe-area (subagent)
- Checkout Stripe primary hsl (subagent)
- Root layout → `brand.*` metadata

## Removido / evitado

- Hero duplicado na home
- Emojis em seções “Por que / Tendências / Lojas”
- Hardcoded Judge TCG strings no metadata (via brand)

## Não migrado (dívida)

- Massa `text-xs` / `luxury-*` / `text-white`
- Judge portal completo
- Finance charts/tables
- Merge total `ui/data-table` ↔ seller DataTable
- Lint error (ainda warn/soft audit)
