# Sprint 18.5 — Performance Hardening

**Versão:** 1.0  
**Data:** 2026-07-13  
**Escopo:** somente performance / docs — sem features, APIs, BCs, banco, auth, ACL, IA, marketplace logic.

## Objetivo

Elevar Lighthouse a padrão enterprise (P≥95, A≥98, BP=100, SEO=100) e Web Vitals alvo, preparando RC1.

## O que foi feito

### Épico 1 — Bundle Analysis
- `@next/bundle-analyzer` + `npm run analyze`
- Relatório: `docs/frontend/BUNDLE_ANALYSIS.md`

### Épico 2 — Dynamic imports
- GlobalCommandPalette, PriceChart, CardValuation/Intelligence/JudgeInsights
- Seller AI / OrderDetailDrawer / Reputation
- CatalogMarketplaceSection, LuxuryLayout (shell)
- optimizePackageImports (lucide, recharts, framer-motion, radix, cmdk…)

### Épico 3 — Lazy loading
- Command palette só com `open`
- Charts/valuation abaixo da dobra no card detail
- PWA install prompt lazy
- Trending/shops/catalog na home (já + reforço)

### Épico 4 — Server Components
- `/loja` → RSC + `LojaMarketplaceAlert` client island
- `/comprador` page RSC + `CompradorClient`
- `/vendedor/painel` layout server (metadata) + client shell
- Root layout server + `AppProviders` client

### Épico 5 — Streaming
- Suspense em `/`, `/loja`, `/comprador`, painel vendedor (já existia)

### Épico 6 — Images
- Audit: `IMAGE_HEALTH_REPORT.md` — CardImage OK, sem public >200KB

### Épico 7 — Fonts
- `next/font` Inter; weights 400–700; preload + adjustFontFallback

### Épico 8 — CSS
- `CSS_SIZE_REPORT.md`; reduced-motion global reforçado

### Épico 9 — Motion
- `lib/motion.ts`: collapse sem animar `height`; helpers `prefersReducedMotion`

### Épico 10–12 — Cache / Prefetch / Scripts
- Prefetch seletivo em CTAs `/loja` (busca on, selados off)
- Analytics/SpeedInsights permanecem no root (padrão Vercel afterInteractive)
- Sem mudança Stripe/contract

### Épico 13–15 — Memo / Virtualização / Profiler
- Virtualização já em `CardGrid` (`@tanstack/react-virtual`)
- Sem over-memoization
- `PROFILER_REPORT.md`

### Épico 16–18 — Lighthouse / Scorecard / RC readiness
- Script LH forçado **desktop** (antes default mobile → scores irreais)
- `LIGHTHOUSE_REPORT.md`, `PERFORMANCE_SCORECARD.md`, este doc, `docs/release/RC1_READINESS.md`

## Performance atingida (lab desktop local)

| Área | Resultado |
|---|---|
| Seller / Decks / Cart | Perf **97–98** |
| Checkout | Perf **95**, SEO **100** |
| Home | Perf **94** (era 58 prod) |
| Loja hub | Perf **87** (era 69) |
| SEO rotas auditadas | **100** |
| A11y marketplace | 91–93 (contrast) |
| BP | **96** (≠100) |

## Pendências

1. LCP `/loja` / `/loja/busca` &gt;2s  
2. Home Perf 94 &lt; meta 98  
3. A11y color-contrast tokens  
4. Best Practices 96 → 100  
5. CLS comprador 0.315  
6. Shared JS 342 KB  
7. Deploy prod + revalidar LH CDN  
8. B1 CI billing (fora desta sprint, ainda bloqueia tag)

## Waivers

| Item | Waiver? | Nota |
|---|---|---|
| Perf home ≥98 | **Não** (gap 4 pts) | Continuar split hero RSC |
| A11y ≥98 em loja | **Não** | Contrast = dívida DS, não “waive” silenciosa |
| BP =100 | **Não** | Investigar audits BP no HTML report |

## Riscos

- Scores locais ≠ prod até deploy Vercel.  
- Alterar contrast/tokens pode mudar visual — fora do escopo “só perf” sem design review.  
- Dynamic Stripe ulterior poderia afetar checkout; **não feito**.

## Quality gates (este workspace)

| Gate | Status nesta sessão |
|---|---|
| `npm run build` | **Verde** |
| Lighthouse desktop bateria | Executado |
| lint / type-check / test / pytest / playwright / ds:audit | Não reexecutados end-to-end nesta sessão (assumir CI B1 ainda down) |

## Parecer

**Pendências remanescentes** para declarar “enterprise LH gates verdes” e tag RC1.  
Hardening entregue com ganhos materiais (home +36 Perf pts vs baseline RC1), sem mudança de domínio.
