# Quality Gates History — RC1.2

**Preset:** desktop · BASE lab `http://localhost:3000`  
**Bateria:** 2026-07-14 ~00:51–00:53 BRT

## Scores

| Rota | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---|---:|---|
| `/` | **100** | **100** | **100** | **100** | 0.8s | 0 | 30ms |
| `/loja` | **97** | **100** | **100** | **100** | 1.3s | 0 | 30ms |
| `/loja/mtg` | **97** | **100** | **100** | **100** | 1.3s | ~0 | 20ms |
| `/loja/busca` | 86 | **100** | **100** | **100** | 1.7s | ~0 | 170ms |
| `/marketplace/cart` → `/carrinho` | **96** | **100** | **100** | **100** | 1.3s | ~0 | 60ms |
| `/checkout` | **95** | **100** | **100** | **100** | 1.5s | ~0 | 80ms |
| `/comprador` | **97** | **100** | **100** | **100** | 1.2s | 0 | 30ms |
| `/vendedor/painel` → `/entrar?…` | **99** | **100** | **100** | **100** | 1.0s | 0 | 40ms |
| `/vendedor/painel/estoque` → `/entrar?…` | **99** | **100** | **100** | **100** | 1.0s | 0 | 30ms |
| `/decks` | **97** | **100** | **100** | **100** | 1.2s | ~0 | 40ms |

## Gates RC (definição)

| Gate | Meta | Lab crítico | Status |
|---|---|---|---|
| Performance | ≥95 | `/` `/loja` `/checkout` `/carrinho` `/comprador` `/decks` ≥95 | **PASS** |
| Accessibility | ≥98 | todas **100** | **PASS** |
| Best Practices | =100 | todas **100** | **PASS** |
| SEO | =100 | todas **100** | **PASS** |
| LCP | &lt;2s | ≤1.5s nas críticas | **PASS** |
| CLS | &lt;0.05 | ≤0.004 | **PASS** |

## Histórico curto

| Run | A11y `/loja` | BP `/loja` | Nota |
|---|---:|---:|---|
| Sprint 19 | 93 | 96 | Perf 74 |
| RC1.1 WebP | 93–96 | 96 | Perf 97–98 |
| RC1.2 | **100** | **100** | Quality gates recovery |

Fonte: `lighthouse-reports/rc12-quality-gates.json`, `summary.json`.
