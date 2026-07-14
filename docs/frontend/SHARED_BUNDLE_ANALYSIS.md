# Shared Bundle Analysis — RC1.1

## Current

**First Load JS shared by all = 341 KB** (build RC1.1)

Chunks típicos:
- ~217 KB runtime/framework
- ~54 KB + ~66 KB shared app

## Theoretical minimum (este monólito)

| Camada | Estimativa | Removível do Store? |
|---|---:|---|
| Next.js App Router + React 19 | ~250–280 KB | **Não** |
| AuthProvider + QueryProvider (root MinimalProviders) | dezenas KB | Só com multi-app / auth edge — risco UX |
| Theme | pequeno | Não (FOUC) |

**Piso arquitetural medido:** ~**337–341 KB** shared enquanto Auth+Query+Next permanecerem no root.

## Meta 200 KB

**Não é o bottleneck do Store LCP.**  
Store LCP caiu de 4.2s → 1.2s **sem** reduzir shared (evidência: images, não JS floor).

Blind chase de 200 KB shared **não** desbloqueia RC1 sozinho; desbloquear Store Perf exigiu image pipeline + RSC grid.

## Remaining opportunities (fora Store)

- Auth sob demanda (alta complexidade)
- Multi-zone / separate apps
- Production source maps policy (BP)
