# UNIVERSAL_CARD_PAGE_REPORT

**Épico 2 — Fase 2**  
**Gerado:** 2026-07-22T05:05:00Z  

## Gate pré-implementação

| Persona | Relatório | Veredito |
|---------|-----------|----------|
| Juliana (UX) | `UX_PORTAL_REPORT.md` | Aprovado com correções (SEO tratado) |
| Carlos (Buyer) | `BUYER_DISCOVERY_REPORT.md` | Aprovado local |
| Eduardo (Search) | `SEARCH_PORTAL_REPORT.md` | **APROVADO** pós-correção |

## Implementação

Página única reutilizável: `CardDetailPage` (+ rotas).

| Rota | Papel |
|------|--------|
| `/{game}/cards/{id}` | Canônica (portal + Theme Engine) |
| `/cards/{id}` | Legado; canonical aponta para rota do jogo |
| `/card/{game}/{slug}` | Alias → redirect canônico |

### Seções entregues

- Hero / buy panel / legalidades / ofertas / versões / histórico de preço (existentes)
- Ações: alerta, coleção (modal), deck (`/decks?add=`), compartilhar, wishlist link
- Decks públicos do mesmo jogo (`CardDecksSection` via Deck API pública)
- Cartas relacionadas (`CardIntelligenceSection`)
- Produtos do universo (`CardRelatedProductsSection` — descoberta via portal)
- Slots IA (`CardAiAdvisorSlots`) — extensão apenas, sem implementação
- Breadcrumbs no caminho do portal (sem “Loja” genérico)
- SEO: title/description/canonical/OG + Product JSON-LD

### Restrições respeitadas

- Nenhum BC novo
- Sem SQL / acesso direto a banco
- Sem lógica específica Lorcana
- Personalização visual via Theme Engine / `data-game` no portal layout
- Apenas APIs públicas (Catalog, Pricing via detail, Marketplace listings, Deck public, Collection modal)

## Evidências locais

- `tsc --noEmit`: OK
- SEO probe: titles + canonicals OK em `/mtg|/pokemon|/lorcana|/onepiece` e PDP
- Sample PDP: `/mtg/cards/e814cff3-496c-4849-88da-a0594d48af64` → 200, JSON-LD presente

## Pendências pós-merge (não bloqueiam aceite de implementação)

- Lighthouse ≥90 em produção após deploy
- Produção ainda sem Epic 1/2 até publish Vercel
- Wishlist por `productId` de carta (quando listing→product existir) pode aprofundar o botão dedicado
- Eventos próximos: API de eventos ainda não integrada nesta página
