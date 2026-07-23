# LIGHTHOUSE_REPORT

**Date:** 2026-07-23  
**Target:** `https://judgetcg.com.br` (desktop, simulated throttling)  
**Tool:** `frontend/runtime_console_v3/scripts/lighthouse-audit.js`

## Scores

| Surface | Perf | A11y | BP | SEO | ≥95 all? |
|---------|-----:|-----:|---:|----:|:--------:|
| `/` | 88 | 100 | 96 | 100 | ❌ Perf |
| `/loja` Marketplace | **98** | 100 | 100 | 100 | ✅ |
| `/loja/mtg` | 91 | 97 | 96 | 100 | ❌ Perf |
| `/loja/busca` Search | **97** | 100 | 100 | 100 | ✅ |
| `/marketplace/cart` | 87 | 100 | 100 | 100 | ❌ Perf |
| `/checkout` | **98** | 100 | 100 | 100 | ✅ |
| `/comprador` Portal | 88 | 100 | 100 | 100 | ❌ Perf |
| `/vendedor/painel` Seller | 92 | 96 | 100 | 100 | ❌ Perf |
| `/vendedor/painel/estoque` | 94 | 96 | 100 | 100 | ❌ Perf |
| `/decks` | 83 | 96 | 100 | 100 | ❌ Perf |

## Gate vs mission

Mission requires **Performance ≥95** on Marketplace, PDP, Knowledge, Collections, Portal, Seller, Dashboard, Checkout.

| Required family | Status |
|-----------------|--------|
| Marketplace `/loja` | PASS |
| Search | PASS |
| Checkout | PASS |
| Portal `/comprador` | **FAIL** Perf 88 |
| Seller dashboard | **FAIL** Perf 92 |
| Cart | **FAIL** Perf 87 |
| Home / Decks | **FAIL** |

A11y / SEO / Best Practices: **≥95 on all audited URLs**.

## Verdict

**FAIL gate Lighthouse Performance universal ≥95**  
Artifacts under `frontend/runtime_console_v3/lighthouse-reports/`.
