# Store Image Report — RC1.1

## Achado crítico (medido)

Logos SVG em `public/logos/` (Yu-Gi-Oh **4093 KB** raw) passavam por `/_next/image` e geravam transfers de **~1.5 MB** por logo → LCP 4.2s+.

## Ações

1. SVGO multipass nos SVG (redução ~65%).
2. Conversão dos logos pesados → **WebP 128px** (2–4 KB) via `sharp`.
3. `GAME_TOKENS.*.logo` aponta para `.webp` onde existe.
4. `GameCard` / mega-menu: `sizes`, `quality={60}`, `unoptimized` para SVG residual (`shouldBypassImageOptimizer`).
5. `priority` nos 4 primeiros cards do grid.

## Depois (LH network `/loja`)

Top image transfers: **~1.6–8 KB** (WebP/SVG leve).

## Checklist

| Item | Status |
|---|---|
| next/image | OK |
| sizes | OK |
| priority (above fold) | OK (4 primeiros) |
| lazy demais | OK |
| >200 KB assets no critical path | **Eliminado** |
