# PLAYER_PROFILE_V2_ACCEPTANCE.md

**Épico 5 — Player Profile V2**  
**Gerado:** 2026-07-22  

## Critérios

| Critério | Status |
|----------|--------|
| Nenhum novo Bounded Context | OK |
| Apenas APIs públicas / BFF existentes | OK (players, collection insights, decks, buyer dashboard, wishlist, gamification) |
| Zero SQL cross-schema | OK (FE only) |
| Theme Engine / tokens reutilizados | OK (surfaces + hero gradient; Collection chart reusado) |
| Compatível com todos os TCGs | OK (favoriteTcgs + collection byGame) |
| Typecheck limpo | OK (`tsc --noEmit`) |
| Lighthouse preservado | Pendente pós-deploy (meta Desktop ≥95 / Mobile ≥90) |
| Personas Juliana, Carlos, Eduardo | Relatórios UX / Buyer / Search / Integration |
| Feature flags | `PLAYER_PROFILE_V2`, `PLAYER_PUBLIC_PROFILE`, `PLAYER_ACHIEVEMENTS`, `PLAYER_ACTIVITY`, `PLAYER_BADGES` |

## Rotas

### Privado (`/perfil`)
- `/perfil` — Resumo (Hero + Dashboard)
- `/colecao` — Coleção (Collection V2, sem duplicar)
- `/perfil/decks`, `/perfil/marketplace`, `/perfil/compras`, `/perfil/vendas`
- `/perfil/wishlist`, `/perfil/favoritos`, `/perfil/conquistas`
- `/perfil/estatisticas`, `/perfil/historico`, `/perfil/configuracoes`

### Público
- `/u/{username}`
- `/u/{username}/collection`
- `/u/{username}/decks`
- `/u/{username}/decks/{slug}` (URL amigável → lista pública nesta versão)
- `/u/{username}/wishlist`

## Extensão IA (somente interfaces)
- `PlayerInsightsProvider`
- `DeckRecommendationProvider`
- `CollectionAdvisor`
- `MarketplaceAdvisor`
- UI scaffold: `ProfileAiSlots`

## Não feito de propósito
- Novo BC / SQL cross-schema
- Regras complexas de achievements
- Unlock avançado de badges
- Activity Feed persistido (usa projeções públicas)
