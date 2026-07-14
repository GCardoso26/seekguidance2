# Image Health Report — Sprint 18.5

**Data:** 2026-07-13  
**Escopo:** `public/` + componentes de imagem do runtime console

## Checklist

| Critério | Status |
|---|---|
| `next/image` em cards / landing | **OK** (`CardImage`, `MarketplaceFirstLanding`) |
| Formatos AVIF/WebP | **OK** (`next.config.mjs` → `images.formats`) |
| `blurDataURL` | **OK** (`CardImage` SVG placeholder) |
| `priority` só hero | **OK** (listas usam `loading="lazy"` / `listQuality`) |
| `sizes` corretos | **OK** (defaults em `CardImage`) |
| Imagens estáticas `public/` >200 KB | **Nenhuma** encontrada |

## Achados

- Cache headers já configurados para `/_next/static` (immutable) e `/images` (SWR).
- Remote patterns amplos (Scryfall, Pokémon, YGO, etc.) — necessário para catálogo; peso controlado via `quality` 60 em listas.
- Preconnect reduzido a **1** CDN crítica (Scryfall); demais passaram a `dns-prefetch` (menos contenção no critical path).

## Ações

- Sem remoção de assets (nenhum local >200 KB).
- Sem mudança de URLs de API/CDN.

## Riscos / follow-up

- Imagens remotas grandes dependem do host de origem; LCP da home/loja ainda sensível a grids abaixo da dobra — mitigating via `dynamic()` de seções.
