# CUSTOMER VALIDATION COUNCIL — Conversion First (Antes × Depois)

**Data:** 2026-07-24  
**Ambiente:** https://judgetcg.com.br (FE `frontend/runtime_console_v3`)  
**Iniciativa:** CUSTOMER CONVERSION FIRST  
**Método:** Evidência de código + testes automatizados + reavaliação das perguntas CVC V2  

---

## Veredito

| Dimensão | Antes (CVC V2) | Depois (este ship) | Delta |
|----------|----------------|--------------------|-------|
| Busca leva a produtos? | **Não** — `/search?q=Rapunzel` abria “Descobrir Torneios” | **Sim** — redirect permanente para `/loja/busca` | Crítico corrigido |
| Home parece loja? | Portal / “escolha seu universo” no LCP | Hero de compra + busca + Singles/Selados/Acessórios no first scroll | Melhora forte de percepção |
| Catálogo vazio? | Parecia laboratório / confuso | Empty states honestos (“sem ofertas”) + similares / wishlist | Confiança ↑; liquidez ainda baixa |
| Facilidade achar produtos | Ruim (URL errada + nav só “Loja”) | ≤2 cliques via hubs + nav Comprar/Singles/Selados/Acessórios | Melhora forte |
| Compraria hoje? | ~0/10 (liquidez + confiança) | Ainda **limitado pela liquidez real** (sem estoque fake) | UX ↑; compra depende de LPC |
| Trust Score (busca) | Muito baixo | Alto na intenção de busca | Melhora |
| Conversion Score (UI path) | Bloqueado na busca | Path desbloqueado | Melhora; conversão $ ainda 0 sem ofertas |

**Customer Experience Index (CXI) — reavaliação honesta**

| Score | Antes | Depois | Nota |
|-------|-------|--------|------|
| CXI (UX path) | ~22/100 | ~48/100 | Path de compra legível |
| Trust (busca/home) | ~15/100 | ~55/100 | Não abre torneio; empty honesto |
| Conversion (UI) | ~10/100 | ~35/100 | Funil rastreável; liquidez bloqueia $ |
| Compraria hoje | 1/10 | 2–3/10 | Sem inventar estoque |
| Facilidade encontrar | 2/10 | 7/10 | Hubs + ranking buy-first |

**Veredito CVC pós-ship:** UX **READY TO ATTRACT** para *explorar* o marketplace.  
**NÃO READY TO CONVERT AT SCALE** enquanto LPC/ofertas reais forem ~0 (North Star).

---

## Perguntas do Council

1. **A busca agora leva produtos antes de conteúdo?**  
   Sim. `/search` → `/loja/busca`; ranking client-side prioriza cartas com oferta; rail de marketplace para intent sealed/accessory; command palette `products` antes de `cards`.

2. **O usuário entende imediatamente onde comprar?**  
   Sim no first viewport: H1 “Onde comprar…”, busca grande, strip Singles/Selados/Acessórios.

3. **Existe sensação de catálogo vazio?**  
   Reduzida: empty copy honesta + CTAs (similares, wishlist, hubs). **Não** escondemos a falta de liquidez.

4. **A Home parece uma loja?**  
   Sim — compra first; universo/ecossistema no fim.

5. **A confiança aumentou?**  
   Na busca e na navegação: sim. Em “há o que comprar?”: só com ofertas reais (sem fake).

---

## Evidências

### Testes

- Vitest: `src/features/search/conversion/__tests__/buyFirstRanking.test.ts`  
  (Rapunzel, Charizard, Black Lotus, Dragon Shield, Perfect Fit, Booster, Playmat, Deck Box)
- Playwright: `e2e/specs/customer-conversion-first.spec.ts`  
  (redirect, home, hubs ≤2 cliques, torneios preservados, queries populares)
- Buyer lifecycle atualizado: `/search?q=Rapunzel` espera `/loja/busca`

### Analytics (registry + FE)

- `search_product_click`, `search_without_products`, `search_abandonment`
- `home_product_ctr`, `category_ctr`, `marketplace_ctr`

---

## Arquivos principais alterados

- `next.config.mjs` — redirect `/search` → `/loja/busca`
- `src/app/search/torneios/page.tsx` — torneios preservados
- `src/features/search/conversion/*` — intent + ranking + empty copy
- `src/components/search/FacetedSearch.tsx` — buy-first + empty + rail
- `src/components/marketplace/MarketplaceHomeRsc.tsx` — home conversion-first
- `src/components/layout/GlobalHeader.tsx` — nav Compra
- `src/app/loja/singles|selados|acessorios/page.tsx` — hubs
- `src/components/cards/CardCard.tsx`, `SellerOffersTable.tsx`, `CardBuyPanel.tsx` — estoque visível
- `src/lib/analytics.ts` + `event_registry.py` — métricas de funil

---

## Decisões de UX

1. Torneios **não removidos** — só deixam de sequestrar queries de compra.  
2. Empty states **honestos** > inventar vitrine.  
3. Institucional abaixo do fold; compra no LCP.  
4. Eventos/Judge/Decks no menu da conta (“Ecossistema”), não no nav primário.

---

## Pendências vs marketplaces TCG maduros

1. **Liquidez real** (LPC) — bloqueio externo a este PR.  
2. Contagens dinâmicas nas hubs (ofertas/preço inicial por categoria) quando a API permitir agregados.  
3. Provider de selados no command palette (Ctrl+K) além do rail da busca.  
4. Histórico de preço / avaliações só com dados reais.  
5. Re-rodar CVC com personas humanas após Lote 1 / ofertas em prod.

---

## Comparativo visual (jornada)

| Passo | Antes | Depois |
|-------|-------|--------|
| Digita Rapunzel em `/search` | Torneios | Loja de compra |
| Abre home | Universos TCG | Onde comprar + busca + categorias |
| Quer acessórios | Difícil achar | `/loja/acessorios` ou intent Dragon Shield |
| Zero ofertas | Página vazia / confusa | Mensagem + similares + wishlist |
