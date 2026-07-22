# COLLECTION_V2_ACCEPTANCE.md

**Épico 3 — Collection V2**  
**Gerado:** 2026-07-22  

## Critérios

| Critério | Status |
|----------|--------|
| Nenhum novo BC | OK |
| Apenas APIs públicas | OK (Collection, Catalog, Pricing history, Wishlist, Deck, Marketplace links) |
| Reutilizável multi-jogo | OK (Theme tokens + gameSlug) |
| Dashboard completo | OK `/colecao` |
| Analytics (séries BFF) | OK + empty honesto |
| Wishlist integrada | OK `/colecao/wishlist` |
| Duplicatas | OK `/colecao/duplicatas` |
| Faltantes | OK set + `/colecao/faltantes` |
| Por jogo / expansão | OK |
| Timeline | Aquisições OK; vendas empty honesto |
| PDP collection/usage | OK |
| Alert scaffold | OK |
| Typecheck | OK (`tsc --noEmit`) |
| Personas | Relatórios UX / Buyer / Search / Integration |
| Lighthouse ≥90 | Pendente pós-deploy |

## Rotas

- `/colecao`, `/colecao/cartas`, `/colecao/jogo/[slug]`, `/colecao/expansao/...`, `/colecao/faltantes`, `/colecao/duplicatas`, `/colecao/wishlist`, `/colecao/alertas`
- `/perfil/colecao` → redirect `/colecao`
