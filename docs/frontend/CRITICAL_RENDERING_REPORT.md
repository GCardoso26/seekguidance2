# Critical Rendering Report — Sprint 19

**Data:** 2026-07-13

## Fonts

- `next/font` Inter weights 400–700, `display: swap`, preload, adjustFontFallback
- Sem Google Fonts externos no critical path

## CSS

- ~109 KB total build
- Luxury CSS sob dynamic layout
- `prefers-reduced-motion` global

## JS / Streaming

- Home: hero sync → Suspense games health → Suspense interactive sections
- MarketplaceProviders no segment tree (não no root)
- Analytics/SpeedInsights afterInteractive (padrão Vercel)

## Images

- `next/image` + AVIF/WebP; CardImage blur; priority só heroes

## Preconnect

- 1× Scryfall preconnect; demais dns-prefetch (menos contention)

## Prefetch

- CTAs `/loja`: busca `prefetch`, selados `prefetch={false}`

## Bloqueadores restantes do CRP

| Recurso | Impacto |
|---|---|
| Shared JS 341 KB | LCP/TBT em hub |
| MobileLayout client | Hidratação header+nav em todas buyer pages |
| Trending grids client | Below-fold OK; ainda compete por main thread |
| Console errors (BP) | BP 96 |
| Source maps ausentes (prod) | BP audit |
