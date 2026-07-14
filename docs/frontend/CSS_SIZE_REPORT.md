# CSS Size Report — Sprint 18.5

**Data:** 2026-07-13  
**Build:** `.next/static/css`

## Totais

| Asset | Tamanho |
|---|---:|
| `285988497ab8f62c.css` | 85.9 KB |
| `6efab9543dd89ebd.css` | 11.0 KB |
| `b8d65abdc9078946.css` | 5.4 KB |
| `c4e4910b2eb3357f.css` | 5.2 KB |
| `590991caeeecb690.css` | 1.2 KB |
| **TOTAL** | **108.7 KB** |

## Ações

- `prefers-reduced-motion` reforçado em `globals.css` (animações/transições/scroll).
- Luxury CSS continua **code-splitted** via dynamic `LuxuryLayout` (não entra nas rotas marketplace/painel).
- `seller-panel.css` permanece scoped ao client layout do vendedor.

## Dívida

- Purge profundo de tokens/`DESIGN_DEBT` não executado nesta sprint (risco visual). `ds:audit` permanece o gate de design system.
- Bundle CSS ~109 KB aceitável; ganho adicional virá de audit Tailwind dead-classes em sprint futura.
