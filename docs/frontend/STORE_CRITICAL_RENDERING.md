# Store Critical Rendering — RC1.1

## Antes

FCP ~0.4s / LCP **4.2–4.4s** — gap = megabyte logos + JS client grid.

## Depois (medido)

| Métrica | Valor |
|---|---|
| TTFB doc | ~10 ms (lab) |
| FCP | ~0.4s |
| LCP | **1.2–1.3s** |
| TBT | **10–30 ms** |
| SI | ~0.5s |

## CRP Store

1. HTML RSC: hero texto + grid bootstrap (logos WebP)
2. Shared JS 341 KB (Auth/Query/Next) — floor
3. Header client hydrate
4. Stream opcional health (contagens) — sem trocar logos

## Preconnect

Sem alteração Store-específica (root já limita a 1 preconnect Scryfall).
