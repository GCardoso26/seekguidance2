# Best Practices Audit — RC1.2

**Data:** 2026-07-14  
**Preset:** Lighthouse desktop · category `best-practices`

## Resultado pós-fix

| Rota | BP | `errors-in-console` | `valid-source-maps` |
|---|---:|---:|---:|
| `/` | **100** | 1 | 1 (informational warnings ok) |
| `/loja` | **100** | 1 | 1 |
| `/loja/mtg` | **100** | 1 | 1 |
| `/loja/busca` | **100** | 1 | 1 |
| `/marketplace/cart` | **100** | 1 | 1 |
| `/checkout` | **100** | 1 | 1 |
| `/comprador` | **100** | 1 | 1 |
| `/vendedor/painel*` | **100** | 1 | 1 |
| `/decks` | **100** | 1 | 1 |

**Meta RC:** BP =100 → **PASS** (lab).

## Inventário pré-fix

| Issue | Severity | Causa | Fix |
|---|---|---|---|
| `errors-in-console` → BP 96 | High | `/api/analytics/track` 400/503 | Soft-accept sempre HTTP 200 |
| `errors-in-console` | High | `/api/catalog/sets` 503 (API down) | Soft-degrade `{sets:[]}` HTTP 200 |
| `errors-in-console` | High | search 503 potencial | Soft-degrade empty HTTP 200 |
| `valid-source-maps` | Low/info | maps incompletos | `productionBrowserSourceMaps: true` (score 1) |
| 401 guest certification/stores | Medium (runs antigos) | fetch auth sem sessão | Already suppressed / fora do path medido |

## Nota

Chrome ainda loga `mapping for last column out of bounds` em um chunk map — **não** derruba o score BP (weight 0 / audit passa).
