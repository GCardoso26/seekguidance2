# JudgeTCG — Public Beta Release Notes

**Status RC1:** ✅ **READY** — tag `RC1`  
**Data:** 2026-07-14  
**Production:** https://judgetcg.com.br  
**Deploy:** `dpl_FHMmjYpsh2W9ewvrC9e5LJpk1z2Y`

## Quality Gates (produção · desktop)

| Rota | Perf | A11y | BP | SEO | LCP |
|---|---:|---:|---:|---:|---|
| `/` | 95 | 100 | 100 | 100 | 1.0s |
| `/loja` | 99 | 100 | 100 | 100 | 0.7s |
| `/loja/busca` | 97 | 100 | 100 | 100 | 1.1s |
| `/checkout` | 99 | 100 | 100 | 100 | 0.8s |
| cart / comprador / decks / seller | ≥99 | 100 | 100 | 100 | ≤0.9s |

Smoke: **34/34**. CI + Quality Gates + Security Scan + Lighthouse CI: **success**.

## Destaques

- Store Performance Recovery (WebP + RSC)  
- Quality Gates Recovery (A11y/BP 100)  
- Checkout: lazy Stripe + shell RSC  
- Busca: shell RSC + islands + defer sets  
- CI: Ruff + TruffleHog recovery  

## Flags

| Flag | FE | BE |
|---|---|---|
| WISHLIST_V2 | on | — |
| SHIPPING_V2 | on | `SHIPPING_V2_ENABLED=false` |

## Breaking changes

Nenhuma.
