# SEARCH_PORTAL_REPORT

**Persona:** Eduardo (Search / SEO)  
**Gerado:** 2026-07-22T05:00:00Z  
**Revalidação:** após correção de `generateMetadata` + `withCanonical`

## Rotas validadas (local `127.0.0.1:3000`)

| Rota | HTTP | Title específico do jogo | Canonical | OG |
|------|------|--------------------------|-----------|-----|
| `/mtg` | 200 | Sim — `Magic: The Gathering - Portal TCG` | `https://judgetcg.com.br/mtg` | Sim |
| `/pokemon` | 200 | Sim — `Pokémon TCG - Portal TCG` | `https://judgetcg.com.br/pokemon` | Sim |
| `/lorcana` | 200 | Sim — `Disney Lorcana - Portal TCG` | `https://judgetcg.com.br/lorcana` | Sim |
| `/onepiece` | 200 | Sim — `One Piece - Portal TCG` | `https://judgetcg.com.br/onepiece` | Sim |
| `/mtg/cards/{id}` | 200 | Sim (nome da carta + jogo) | `…/mtg/cards/{id}` | Sim (+ JSON-LD Product) |

## Busca

| Tipo | Status |
|------|--------|
| Global `/loja/busca` | OK (pré-existente) |
| Contextual `/{game}/cards` | OK + canonical `/{game}/cards` |
| Alias `/card/{game}/{id}` | Redirect → `/{game}/cards/{id}` |
| API search `game=MTG` | OK |

## Gaps remanescentes (P2, não bloqueiam)

1. Portais sem JSON-LD CollectionPage (opcional).
2. Lighthouse ≥90: não medido em prod nesta rodada (meta mantida).
3. Produção `judgetcg.com.br` ainda pode não refletir Epic 1/2 até deploy.

## Veredito Eduardo

**APROVADO** (ambiente local / branch atual).  
Metadata + canonical dos portais e PDP game-scoped corrigidos. Gate de Search liberado.
