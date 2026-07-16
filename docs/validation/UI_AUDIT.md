# UI_AUDIT.md

## System health

Design system primitives exist; inconsistency in empty states, navigation labels, and shell composition (store-only cart drawer).

## Findings by surface

| Surface | Issues | Pri |
|---------|--------|-----|
| Header | BP3.5 OK; Entrar without next; residual discovery | P1–P2 |
| Mobile bottom nav | Loja vs Comprador overlap | P1 |
| Tables / seller panels | Variable empty states vs PageEmpty | P2–P3 |
| Modals / drawers | Cart drawer scope incomplete | P1 |
| Forms | Confirm email as red error | P1 |
| Loading / skeletons | Search silent fail; Perf cold debt | P0–P2 |
| Contrast / spacing | Not exhaustive visual QA — flag design pass | P3 |
| Overflow / responsive | Prefer follow-up visual bug bash | P3 |

## Recommendations

- Visual QA pass (responsive + contrast) after P0 functional.  
- Standardize empty/error/loading via DS.  
- Remove redundant CTAs that contradict BP3.5 header story.
