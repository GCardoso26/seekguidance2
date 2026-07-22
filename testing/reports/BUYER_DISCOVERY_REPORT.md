# BUYER_DISCOVERY_REPORT

**Persona:** Carlos (Buyer)  
**Gerado:** 2026-07-22T04:34:00Z  
**Ambiente:** local FE Épico 1  

## Teste 10 segundos

> Em menos de 10 segundos eu sei exatamente para onde devo ir?

**SIM (local).** Na home, o hero “Escolha seu universo” + grid de TCGs responde o destino em &lt;1 viewport.  
**NÃO (produção atual):** `judgetcg.com.br/` ainda sem o hero (Épico 1 não deployado) — buyer em prod continua na home marketplace antiga.

## Fluxo executado (HTTP/smoke)

| Passo | Resultado |
|-------|-----------|
| Entrar Home | 200 · universe grid presente |
| Entrar Magic `/mtg` | 200 · `data-game` + portal nav |
| Voltar conceito | Link “Todos os universos” no PortalHero |
| Lorcana `/lorcana` | 200 · tema distinto |
| Pokémon `/pokemon` | 200 · tema distinto |
| Buscar carta | `/api/catalog/cards/search?game=MTG` → card `e814cff3-…` |
| Abrir página da carta | `/mtg/cards/e814cff3-…` → **200** (PDP existente) |
| Marketplace | PortalNav → `/loja/busca?game=` |
| Wishlist / Decks | Rotas existem; wishlist requer auth (não exercitado login nesta rodada) |

## Achados buyer

- Descoberta multi-jogo **clara** no local.
- PDP sob namespace do jogo (`/{game}/cards/{id}`).
- `CardActions` wired: Coleção (modal/login), Deck (`/decks?add=`), Compartilhar, Wishlist link.

## Veredito Carlos

**APROVADO (local) / BLOQUEADO em produção** até deploy do Épico 1+2.  
Universal Card Page implementada no código; merge/prod depende do publish.
