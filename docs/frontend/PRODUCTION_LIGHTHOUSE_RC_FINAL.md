# Production Lighthouse — RC Final

**Data:** 2026-07-14  
**BASE:** `https://judgetcg.com.br`  
**Deploy:** `dpl_FHMmjYpsh2W9ewvrC9e5LJpk1z2Y`  
**Preset:** desktop · thresholds Perf≥95 A≥98 BP=100 SEO=100

## Depois (RC final)

| Rota | Perf | A11y | BP | SEO | LCP | CLS |
|---|---:|---:|---:|---:|---|---|
| `/` | **95** | 100 | 100 | 100 | 1.0s | 0.045 |
| `/loja` | **99** | 100 | 100 | 100 | 0.7s | 0.045 |
| `/loja/busca` | **97** | 100 | 100 | 100 | 1.1s | 0.045 |
| `/checkout` | **99** | 100 | 100 | 100 | **0.8s** | 0 |
| `/marketplace/cart` | **99** | 100 | 100 | 100 | 0.9s | ~0 |
| `/comprador` | **99** | 100 | 100 | 100 | 0.9s | 0.038 |
| `/vendedor/painel` | **100** | 100 | 100 | 100 | 0.7s | 0 |
| `/decks` | **99** | 100 | 100 | 100 | 0.9s | ~0 |

**Script:** todas OK (`exit 0`).

## Antes → Depois (blockers)

| Rota | Antes Perf / LCP | Depois Perf / LCP | Δ Perf |
|---|---|---|---|
| `/checkout` | **91** / 2.0s | **99** / 0.8s | **+8** |
| `/loja/busca` | **86** / 2.1s | **97** / 1.1s | **+11** |

## Gates

| Gate | Meta | Status |
|---|---|---|
| Perf ≥95 (todas listadas) | sim | **PASS** |
| A11y =100 | sim | **PASS** |
| BP =100 | sim | **PASS** |
| SEO =100 | sim | **PASS** |
| LCP &lt;2s | sim | **PASS** |
| CLS &lt;0.05 | sim | **PASS** |
