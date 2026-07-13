# Release Manifest — RC1 (preparado, não taggeado)

## Identidade

| Campo | Valor |
|---|---|
| Produto | JudgeTCG |
| Candidato | RC1 |
| Branch | `main` |
| Commit base | `e6a3b884` |
| Tag | **não criada** (NO-GO) |
| Data auditoria | 2026-07-13 |

## Escopo congelado (Sprints 1–17)

- Seller Experience, Buyer Experience, Catalog Intelligence  
- Search Platform, Seller AI, Inventory Platform (S17)  
- Design System v3 (`ds:audit` 0)

## Artefatos de release

Ver `RELEASE_ARTIFACTS.md`.

## Flags (estado observado em prod)

| Flag | FE `/api/health` | BE `/v1/health` |
|---|---|---|
| `wishlist_v2` | true | — |
| `shipping_v2` | true | false (`SHIPPING_V2_ENABLED`) |

## Decisão

Manifesto preparado para quando Go for aprovado. Até lá, **não** anexar tag.
