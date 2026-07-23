# QA_PLATFORM_V6_3 — Gate Closure

**Date:** 2026-07-23  
**Verdict:** **READY FOR PRODUCTION = TRUE**

## BUG-V6-004 — Lighthouse

**Root cause:** production chunk `ed9f2dc4-*.js` contained Next.js `next-devtools` (~212 KiB, ~100% unused) triggered by `browserslist: last 2 * versions` (Next 15 webpack/SWC interaction).

**Fixes (no new features):**
- browserslist → modern evergreen targets
- webpack `NormalModuleReplacementPlugin` strip for next-devtools/dev-overlay
- dynamic UpgradeModal / header islands / hero search
- `/comprador` luxury-route exclude
- tournament-games light import; seller dashboard dynamics
- Home: UniverseHomeHero as RSC + static LCP (no Suspense health race)

**Deploy:** Vercel prod → `judgetcg.com.br`  
**Re-audit:** all 10 URLs **≥95** on P/A/BP/SEO (home P:99).

## BUG-V6-011 — Personas

| Persona | Evidence |
|---------|----------|
| Marina / Carlos / Juliana | Playwright Chromium @ prod **21 PASS** |
| Eduardo | BullMQ+Redis cert + `/admin/product-catalog` 200 |
| Fernanda | `/loja`, busca, marketplace produtos 200 |
| Renato | `/`, observability, deployments, seller, load 1000 PASS |

## Gate

P0=0 · P1=0 · Lighthouse PASS · Personas PASS → **READY_FOR_PRODUCTION = TRUE**
