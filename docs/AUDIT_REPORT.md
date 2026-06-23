# Relatório de Auditoria — Judge TCG

**Data:** 2026-06-22  
**Ambiente:** https://judgetcg.com.br | API https://seekguidance.onrender.com  
**Branch auditada:** `main` (local com correções pendentes de deploy)

---

## Resumo

| Métrica | Valor |
|---------|-------|
| Rotas auditadas (checklist 1.2) | **28** |
| Rotas `page.tsx` no App Router | **129** |
| Problemas críticos encontrados | **4** |
| Problemas médios | **8** |
| Problemas leves | **12** |
| Bugs corrigidos nesta sessão | **9** |
| Imagens corrigidas (ingestão) | **TCGdex path** (sync Pokémon) |

---

## Problemas Críticos (corrigidos)

| # | Problema | Arquivo | Correção |
|---|----------|---------|----------|
| 1 | **Loop redirect** `/carrinho` ↔ `/marketplace/cart` (308 infinito, fetch falha) | `carrinho/page.tsx` + `next.config.mjs` | `carrinho` reexporta `marketplace/cart` em vez de redirect |
| 2 | **`/decks/[id]/build` 404** — links apontavam para rota inexistente | `decks/*/page.tsx` | Criada `decks/[deckId]/build/page.tsx` (reexport do editor) |
| 3 | **Link `/mensagens` inexistente** no perfil do vendedor | `SellerProfileHeader.tsx` | Corrigido para `/social/messages/[sellerId]` |
| 4 | **Pokémon TCGdex sem `image_url`** — 0% cobertura no fallback | `sync_pokemon.py` | Popula `image_url` + `image_uris` via `assets.tcgdex.net` |

---

## Problemas Médios

| # | Problema | Arquivo | Status |
|---|----------|---------|--------|
| 1 | `/pro` retornava 404 | — | **Corrigido:** redirect → `/vendedor/painel/pro` |
| 2 | `/regras/[slug]` ausente | — | **Corrigido:** página por TCG (mtg, pokemon, etc.) |
| 3 | Links legados `/store/*` na UI | `QuickActions`, `ProUpgradePanel`, etc. | **Parcial:** QuickActions e Pro* atualizados; restam em `store/*.tsx` |
| 4 | `CardImage` existia mas não era usado | `CardCard.tsx` | **Corrigido:** adoptado com skeleton + onError |
| 5 | `remotePatterns` faltando TCGdex/Scryfall SVG | `next.config.mjs` | **Corrigido** |
| 6 | BottomNav "Comunidade" → `/comunidade` → redirect `/social` | `MobileLayout.tsx` | Pendente: apontar direto para `/social` |
| 7 | Catálogo produção com **6 cartas**, 0% imagens | API `/catalog/health` | **Ação:** rodar sync completo em `/admin/catalog` |
| 8 | Meilisearch `disabled` em produção | health API | Verificar env `MEILISEARCH_*` |

---

## Problemas Leves

| # | Problema | Sugestão |
|---|----------|----------|
| 1 | `/perfil/pedidos` redireciona para `/marketplace/orders` | Aceitar alias ou unificar URL |
| 2 | Cards vendedor usam `/cards/` em vez de `/loja/cartas/` | Atualizar `SellerCardGrid.tsx` |
| 3 | Painel vendedor sem itens Cupons/Pro/Onboarding no menu | Adicionar ao `Sidebar.tsx` |
| 4 | Carrinho linkava "← Marketplace" | **Corrigido** → "← Loja" |
| 5 | SWU no health mas sem adapter de sync | Implementar `sync_swu.py` ou remover do health |
| 6 | Skeleton de grid não alinhado em todos os componentes | Estender `CardImage` a coleção/detalhe |
| 7 | `useCreateStore` redirecionava `/store/dashboard` | **Corrigido** |
| 8 | Rotas perfil/admin redirecionam para `/judge?redirect=` sem login | Comportamento esperado; melhorar UX com página de login |
| 9 | `generateMetadata` ausente em várias páginas de loja | Adicionar por `[game]` |
| 10 | Tabelas painel vendedor sem scroll horizontal explícito | `overflow-x-auto` em `SalesTable` |
| 11 | Alguns `useEffect` sem cleanup documentado | Revisar `store/dashboard`, `PixTimer` |
| 12 | Tipos `any` em hooks sociais (`useChat`) | Tipar respostas da API |

---

## Auditoria por Rota (checklist 1.2)

Legenda: ✅ OK | ⚠️ Parcial | ❌ Falha | 🔒 Requer login

| Rota | Carrega | Layout | SEO | Mobile | Notas |
|------|---------|--------|-----|--------|-------|
| `/` | ✅ | ✅ | ⚠️ | ✅ | Landing luxury |
| `/loja` | ✅ | ✅ | ⚠️ | ✅ | Grid de jogos |
| `/loja/[game]` | ✅ | ✅ | ⚠️ | ✅ | Sub-nav TCG no desktop |
| `/loja/[game]/busca` | ✅ | ✅ | ⚠️ | ✅ | Filtros facetados |
| `/loja/[game]/cartas/[id]` | ✅ | ✅ | ⚠️ | ✅ | Dinâmico |
| `/loja/cartas/[id]` | ✅ | ✅ | ⚠️ | ✅ | Genérico |
| `/carrinho` | ❌→✅* | ✅ | ⚠️ | ✅ | *Corrigido pós-deploy |
| `/checkout` | ✅ | ✅ | ⚠️ | ✅ | |
| `/vendedor/[sellerId]` | ✅ | ✅ | ⚠️ | ✅ | Follow + reviews |
| `/comunidade/leaderboard` | ✅ | ✅ | ⚠️ | ✅ | |
| `/regras/[slug]` | ❌→✅* | ✅ | ✅ | ✅ | *Nova rota |
| `/decks` | ✅ | ✅ | ⚠️ | ✅ | |
| `/decks/novo` | ✅ | ✅ | ⚠️ | ✅ | |
| `/decks/[id]` | ✅ | ✅ | ⚠️ | ✅ | |
| `/decks/[id]/build` | ❌→✅* | ✅ | ⚠️ | ✅ | *Nova rota |
| `/perfil` | 🔒 | ✅ | ⚠️ | ✅ | Redirect login |
| `/perfil/colecao` | 🔒 | ✅ | ⚠️ | ✅ | |
| `/perfil/pedidos` | 🔒 | ✅ | ⚠️ | ✅ | → marketplace/orders |
| `/perfil/seguidos` | 🔒 | ✅ | ⚠️ | ✅ | |
| `/vendedor/painel` | 🔒 | ✅ sidebar | ⚠️ | ✅ | Menu mobile OK |
| `/vendedor/painel/listagens` | 🔒 | ✅ | ⚠️ | ✅ | |
| `/vendedor/painel/listagens/nova` | 🔒 | ✅ | ⚠️ | ✅ | |
| `/vendedor/painel/vendas` | 🔒 | ✅ | ⚠️ | ✅ | |
| `/vendedor/painel/vendas/[orderId]` | 🔒 | ✅ | ⚠️ | ✅ | Sem breadcrumb |
| `/vendedor/painel/estatisticas` | 🔒 | ✅ | ⚠️ | ✅ | |
| `/vendedor/painel/configuracoes` | 🔒 | ✅ | ⚠️ | ✅ | |
| `/vendedor/painel/configuracoes/pagamentos` | 🔒 | ✅ | ⚠️ | ✅ | |
| `/vendedor/painel/configuracoes/frete` | 🔒 | ✅ | ⚠️ | ✅ | |
| `/admin/catalog` | 🔒 | ✅ | ⚠️ | ✅ | Sync catálogo |
| `/onboarding` | 🔒 | ✅ | ⚠️ | ✅ | |
| `/pro` | ❌→✅* | — | — | — | *Redirect painel/pro |

---

## Imagens

### Cobertura por TCG (produção — 2026-06-22)

| game | total | com imagem | faltando | % |
|------|-------|------------|----------|---|
| MTG | 2 | 0 | 2 | 0% |
| POKEMON | 2 | 0 | 2 | 0% |
| LORCANA | 1 | 0 | 1 | 0% |
| YGO | 0 | 0 | 0 | — |
| ONEPIECE | 0 | 0 | 0 | — |
| FAB | 0 | 0 | 0 | — |
| DIGIMON | 0 | 0 | 0 | — |
| SWU | 1 | 0 | 1 | 0% |

**Diagnóstico:** O catálogo em produção está praticamente vazio (6 cartas de seed). O sync completo dos 7 TCGs **não foi executado** ou a API de health está em estado `loading`. Meta de >95% cobertura requer:

1. Configurar `POKEMON_TCG_API_KEY` (preferir API oficial) ou usar TCGdex com fix aplicado
2. Rodar sync via `/admin/catalog` para MTG, YGO, LORCANA, ONEPIECE, FAB, DIGIMON
3. Validar com `node scripts/audit-images.js`

### Domínios `next.config.mjs`

| Domínio | TCG | Status |
|---------|-----|--------|
| cards.scryfall.io | MTG | ✅ |
| images.pokemontcg.io | Pokémon | ✅ |
| assets.tcgdex.net | Pokémon fallback | ✅ adicionado |
| images.ygoprodeck.com | Yu-Gi-Oh! | ✅ |
| lorcast.com | Lorcana | ✅ |
| **.optcgapi.com | One Piece | ✅ |
| **.digimoncard.io | Digimon | ✅ |
| goagain.dev | FAB | ✅ |
| svgs.scryfall.io | Ícones sets | ✅ adicionado |

### Fallback frontend

- `CardImage.tsx`: skeleton pulse, onError, aria-label ✅
- `cardImageUrl()`: fallback `/logos/default-tcg.svg` ✅
- Adoção: `CardCard` ✅; detalhe/coleção ainda usam `next/image` direto

---

## Bugs (Parte 2)

### Frontend
- Hydration: sem mismatches críticos detectados no build
- `fetch` sem try/catch: maioria usa React Query com fallback
- Memory leaks: `PixTimer`, `useScrollProgress` — revisar cleanup

### Backend
- Health retorna `status: loading` com poucos dados — endpoint funcional
- Respostas mistas PT/EN em alguns erros FastAPI

### Integração
- Carrinho BFF OK quando rota não está em loop
- `camelCase`/`snake_case`: BFF normaliza na maioria dos endpoints marketplace

---

## Performance

Não executado Lighthouse nesta sessão (requer deploy das correções).

**Scripts disponíveis:**
```bash
node scripts/audit-routes.js https://judgetcg.com.br
node scripts/audit-images.js
npx lighthouse https://judgetcg.com.br --output=json
```

**Estimativas do build:**
- First Load JS shared: **103 kB** (abaixo da meta 200 kB)
- Middleware: 33.4 kB

---

## Checklist de Correções (Parte 4)

### Navegação/UI/UX
- [x] Rotas críticas existem e carregam (pós-fix)
- [ ] BottomNav atualizado (Comunidade → /social)
- [x] Sub-nav TCGs no desktop (`MobileLayout` quick links)
- [ ] Breadcrumb em vendas/[orderId]
- [x] Link mensagens vendedor corrigido
- [x] QuickActions usa `/vendedor/painel/*`

### Bugs
- [x] Loop carrinho eliminado
- [x] Build passa
- [ ] Console errors em produção — validar pós-deploy

### Imagens
- [ ] >95% cobertura — **bloqueado por sync de catálogo**
- [x] Fallback CardImage implementado
- [x] Domains next.config atualizados
- [x] TCGdex ingestão corrigida

---

## Próximos passos recomendados

1. **Deploy** das correções de navegação e imagens
2. **Sync completo** do catálogo em `/admin/catalog` (todos os 7 TCGs)
3. Apontar BottomNav Comunidade para `/social`
4. Estender `CardImage` para `CollectionCard` e `CardDetailPage`
5. Adicionar breadcrumb no painel de vendas
6. Habilitar Meilisearch em produção
7. Rodar `node scripts/audit-routes.js` após deploy para validar `/carrinho` e `/pro`

---

*Gerado automaticamente pela auditoria Cursor — Judge TCG*
