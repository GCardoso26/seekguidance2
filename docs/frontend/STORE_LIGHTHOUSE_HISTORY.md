# Store Lighthouse History — RC1.1

Preset: **desktop** · BASE: `http://localhost:3000`

| Run | Contexto | Perf | A11y | BP | SEO | LCP | CLS |
|---|---|---:|---:|---:|---:|---|---|
| Sprint 19 baseline | prod/lab Store | **74** | 93 | 96 | 100 | **4.2s** | 0 |
| RC1.1 #1 RSC grid | lab | 77 | 93 | 96 | 100 | 4.4s | 0 |
| RC1.1 #2 WebP logos | lab | **98** | 93 | 96 | 100 | **1.2s** | 0 |
| RC1.1 #3 card a11y | lab | **97** | **96** | 96 | 100 | **1.3s** | 0 |
| RC1.2 quality gates | lab | **97** | **100** | **100** | 100 | **1.3s** | 0 |

## DoD Store

| Gate | Meta | Último medido | Status |
|---|---|---|---|
| Perf | ≥95 | **97** | **PASS** |
| LCP | &lt;2s | **1.3s** | **PASS** |
| CLS | &lt;0.05 | **0** | **PASS** |
| SEO | 100 | **100** | **PASS** |
| A11y | ≥98 | **100** | **PASS** |
| BP | 100 | **100** | **PASS** |

## Sem regressão (bateria WebP)

Home 95 · Checkout 95 · Comprador 95 · Seller 99 · Cart 97 · Decks 97.
