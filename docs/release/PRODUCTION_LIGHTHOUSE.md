# Production Lighthouse — RC1

**Data:** 2026-07-14  
**Preset:** desktop  
**BASE:** `https://judgetcg.com.br`  
**Ferramenta:** `node scripts/lighthouse-audit.js` (`BASE_URL` prod)

## Scores

| Rota | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---|---|---|
| `/` | **97** | **100** | **100** | **100** | 1.2s | 0 | 50ms |
| `/loja` | **100** | **100** | **100** | **100** | **0.7s** | 0 | 10ms |
| `/loja/mtg` | 99 | 100 | 100 | 100 | 0.9s | ~0 | 50ms |
| `/loja/busca` | **86** | 100 | 100 | 100 | 2.1s | 0 | 100ms |
| `/marketplace/cart` → `/carrinho` | **99** | 100 | 100 | 100 | 0.8s | ~0 | 10ms |
| `/checkout` | **91** | 100 | 100 | 100 | **2.0s** | ~0 | 60ms |
| `/comprador` | 99 | 100 | 100 | 100 | 0.9s | 0.038 | 20ms |
| `/vendedor/painel` → `/entrar?…` | 100 | 100 | 100 | 100 | 0.7s | 0 | 20ms |
| `/decks` | 99 | 100 | 100 | 100 | 0.8s | ~0 | 20ms |

## vs RC1.2 local (críticas)

| Rota | Lab Perf/A/BP | Prod Perf/A/BP |
|---|---|---|
| `/` | 100/100/100 | 97/100/100 |
| `/loja` | 97/100/100 | **100/100/100** |
| cart | 96/100/100 | 99/100/100 |
| checkout | 95/100/100 | **91/100/100** |
| comprador | 97/100/100 | 99/100/100 |
| decks | 97/100/100 | 99/100/100 |

## Gates vs definição RC Phase 10

| Gate | Meta | Produção | Status |
|---|---|---|---|
| A11y | ≥98 | **100** (todas) | **PASS** |
| BP | =100 | **100** (todas) | **PASS** |
| SEO | =100 | **100** | **PASS** |
| Perf críticas | ≥95 | `/checkout` **91** | **FAIL** |
| LCP | &lt;2s | `/checkout` **2.0s**, `/loja` 0.7s | **FAIL** (checkout) |
| CLS | &lt;0.05 | máx 0.038 | **PASS** |

Store hub (`/loja`) excedeu metas. **Checkout** é o blocker mensurável de Perf/LCP em produção nesta bateria.
