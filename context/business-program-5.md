# Business Program 5 — Product Excellence

**Date:** 2026-07-15  
**Mode:** Eliminate friction · **No new feature surface area**  
**Investment framing:** US$100M marketplace bar (Cardmarket · TCGPlayer · ML · Shopify · Amazon · Stripe · Steam · Discord)

## Absolute rule

Perfect what exists. If a control does not raise conversion, trust, or speed of an existing job: **remove / hide / postpone / simplify**.

## Gates (every PR)

UX · Accessibility · Performance · Marketplace · Product · Visual · Trust — all PASS, screen scores ≥ **9.8**.

## 4.5 → 5 remediation map

| Persona / ID | Friction | BP5 action (not a new product) |
|--------------|----------|--------------------------------|
| Impaciente / BUY-001 | `/login` | Unify `entrarPath(next)` |
| BUY-002 | `redirect` vs `next` | Accept both on `/entrar` |
| BUY CTA dup | Same handler twice | One primary Comprar |
| Desconfiado | Legal / CNPJ | Termos + trust strip + brand legal |
| Burro | EN jargon | Glossary · PT labels |
| Experiente | Worse than CM/Liga | Auth + trust + speed parity sprint |
| Irritado | Blur/pulse/SaaS | Reduce chrome noise |
| Idoso | Caption/contrast | Bump type · darker muted |
| Lojista | >30s · redirect | Publish and next |
| Juiz | JSON ops | Hide debug · route to real ops |
| Malicioso | soft-open · double click | Hard 403 · pending guards |
| PM cruel | Claim without proof | Tone down hero overclaims |

## Explicit non-goals

- New wallets, runtimes, or platforms
- New tournament floor rebuild as greenfield (simplify + deep-link existing)
- Feature flags that add chrome

## Scorecard location

`docs/validation/PRODUCT_EXCELLENCE_SCORECARD.md`

## Glossary

`docs/product/GLOSSARY_PT.md`
