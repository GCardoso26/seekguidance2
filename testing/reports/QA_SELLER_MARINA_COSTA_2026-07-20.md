# Relatório de Validação — Persona Vendedor QA

**Persona:** Marina Costa — hobby store TCG (singles + selados)  
**Data:** 2026-07-20  
**Modo:** Ciclo supervisionado 1 (local/CI) — **sem** Beta/Produção  
**Hierarchy:** Platform Constitution → ADRs → North Star R1 → … → Código  
**Guard:** `assert-not-beta.mjs` → `env=local` ✓  

> **Declaração:** a plataforma **não** está “pronta”. Este relatório cobre apenas o que foi validado em local/CI, o que falhou/bloqueou, e o que falta em UI real (staging com stack no ar).

---

## Resumo executivo

| Campo | Valor |
| --- | --- |
| **Ambiente testado** | `local` (CI unitário / in-memory). Staging UI **não** disponível nesta sessão (`localhost:3000` sem resposta). Beta/Prod **não** tocados. |
| **Jogos testados** | Lorcana (domínio+provider+personas); MTG (provider modular SHADOW); Pokémon (provider Implemented/OFF); packs personas OP/DB/Digimon/Riftbound/Naruto (composição apenas). **UI multi-jogo live: não executada.** |
| **Funcionalidades testadas** | Auth/onboard/publish/offers (golden path in-memory); checkout cart→session (e2e in-memory); GameConfig R2 FE; marketplace domain; personas/compose; smoke HTTP (falhou — sem servidor). |
| **Resultado geral** | **PARCIAL — BLOQUEADO PARA UI.** Domínio Catalog/Marketplace/Order em memória **verde**. Jornada Marina no browser **não** pôde ser concluída sem stack local/staging. |
| **Bugs P0** | 2 abertos documentados (histórico Beta) **não revalidados** aqui + 1 bloqueio operacional (smoke sem servidor). Ver §Bugs. |
| **Bugs P1** | 3 (wave seller vs ADR-013; relatórios mock; PCS baixo / E2E persona incompleto). |
| **Bugs P2** | 2 |
| **Bugs P3** | 1 |

**North Star:** LPC/LCS **não** alimentados. Métricas de engenharia (TCS/PCS) registradas só como cobertura de QA.

---

## Cobertura por jogo

| Jogo | Singles | Selados | Estoque | Compra | Relatório | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Disney Lorcana | Domínio ✓ / UI ✗ | UI ✗ | Domínio ✓ / UI ✗ | Domínio ✓ / UI ✗ | Mock only | **Parcial** |
| MTG | Provider SHADOW ✓ / UI ✗ | ✗ | ✗ | ✗ | ✗ | **Parcial eng.** |
| Pokémon | Provider OFF ✓ / UI ✗ | ✗ | ✗ | ✗ | ✗ | **Parcial eng.** |
| One Piece | Personas compose ✓ | ✗ | ✗ | ✗ | ✗ | **Não validado UI** |
| Dragon Ball | Personas compose ✓ | ✗ | ✗ | ✗ | ✗ | **Não validado UI** |
| Digimon | Personas compose ✓ | ✗ | ✗ | ✗ | ✗ | **Não validado UI** |
| Riftbound | Personas + RESEARCH ✓ | ✗ | ✗ | ✗ | ✗ | **Não validado UI** |
| Naruto | Personas scaffold ✓ | ✗ | ✗ | ✗ | ✗ | **Research — sem LIVE** |

---

## Cobertura por funcionalidade

| Funcionalidade | Testada | Resultado | Evidência |
| --- | --- | --- | --- |
| Guard Beta | Sim | PASS | `assert-not-beta.mjs` env=local |
| Personas / compose | Sim | PASS | `test:personas`, `test:compose` (24 personas) |
| Auth register/login/logout/refresh | Sim (in-memory) | PASS | `performanceBudget` golden path |
| Onboard seller + inventory qty | Sim (in-memory) | PASS | idem |
| Publish listing → search offers | Sim (in-memory) | PASS | publish 14ms; getOffers 2ms |
| Checkout → pay request → webhook | Sim (in-memory) | PASS | `checkout.api.e2e` |
| Cart UI (fase 14) | Sim (unit) | PASS | `CartPhase14.test.tsx` |
| GameConfig / filtros R2 | Sim (unit) | PASS | `gameConfig.r2.test.ts` |
| Lorcana provider beachhead | Sim | PASS | `LorcanaProvider` + `beachheadRegistry` |
| MTG Scryfall modular | Sim | PASS | `ScryfallModular.test.ts` |
| Pokémon dataset OFF | Sim | PASS | `PokemonProvider.test.ts` |
| Smoke HTTP local | Sim | **FAIL** | `test:smoke` — fetch failed :3000 |
| Playwright persona UI | Não (só credentials) | N/A | `persona-flows.spec.ts` |
| Publicar singles no browser | Não | **BLOQUEADO** | sem servidor |
| Selados booster/box | Não | **BLOQUEADO** | sem servidor |
| Relatórios seller reais | Não | **NÃO VALIDADO** | painel usa mocks |
| Pagamento real | Não | N/A (proibido) | — |

---

## Bugs encontrados

### [P0] Smoke local sem stack — jornada Marina impossível nesta sessão

- **Ambiente:** local  
- **Jogo:** N/A  
- **Fluxo:** Ciclo 1 UI (busca → publish → PDP → cart)  
- **Passos:** `npm run test:smoke` com `BASE_URL` default `http://localhost:3000`  
- **Esperado:** health/search 2xx  
- **Obtido:** `fetch failed` em `/health`, `/cards`, `/search`  
- **Evidência:** saída `test:smoke` 2026-07-20  
- **Impacto:** impede validação funcional UI supervisionada  
- **Hipótese:** FE/API não iniciados nesta máquina  
- **Arquivos:** `testing/smoke/smoke-readonly.mjs`  

### [P0] Carta errada no carrinho (fallback PDP `tcg_id`) — aberto em ops (não revalidado)

- **Ambiente:** documentado para Beta (não executado)  
- **Jogo:** Lorcana (beachhead)  
- **Fluxo:** PDP → cart  
- **Esperado:** item do cart = carta da PDP  
- **Obtido:** histórico: fallback `tcg_id` pode anexar carta errada  
- **Evidência:** `docs/operations/BETA_COMMAND_CENTER.md` (2026-07-17)  
- **Impacto:** quebra confiança do comprador; risco LPC  
- **Hipótese:** proxy/PDP usa id de jogo em vez de card id  
- **Arquivos suspeitos:** rotas PDP/cart Python API; FE cart adapters  

### [P0] 500 cart/checkout — race `shopping_carts` — aberto em ops (não revalidado)

- **Ambiente:** documentado Beta  
- **Fluxo:** add cart / initiate checkout  
- **Esperado:** 2xx estável  
- **Obtido:** histórico 500 por race  
- **Evidência:** Beta Command Center  
- **Impacto:** impede checkout  
- **Arquivos suspeitos:** API Python `shopping_carts`  

### [P1] Wave seller / mega-menu inclui TCGs fora da allowlist ADR-013 (e denylist)

- **Ambiente:** código FE (local)  
- **Fluxo:** `GameSelectorTabs` / `isGameInImplementationWave`  
- **Esperado:** apenas allowlist ADR-013 (e denylist nunca navegável)  
- **Obtido:** wave inclui **YGO**, **FAB**; tabs seller listam **vanguard**, **swu**, **union-arena** (denylist ADR-013)  
- **Evidência:** `game-rollout.ts`, `seller-product-categories.ts`  
- **Impacto:** Marina pode tentar operar jogos que a estratégia proíbe → confusão + risco de inventário órfão  
- **Hipótese:** wave de UI não sincronizada com ADR-013 pós-constituição  
- **Arquivos:** `frontend/runtime_console_v3/src/lib/game-rollout.ts`, `seller-product-categories.ts`  

### [P1] Relatórios do vendedor ainda mockados

- **Ambiente:** código FE  
- **Fluxo:** analytics / relatório vendas  
- **Esperado:** totais a partir de pedidos reais (staging)  
- **Obtido:** `sellerAnalyticsMock` / testes de painel com mock  
- **Evidência:** `SellerAnalyticsPanel.test.tsx`, `seller-analytics-mock`  
- **Impacto:** Marina não confia nos números para reposição  
- **Arquivos:** `src/lib/seller-analytics-mock.ts`, `SellerAnalyticsPanel.tsx`  

### [P1] Automação persona E2E incompleta (PCS 12.5%)

- **Ambiente:** local CI analytics  
- **Fluxo:** Playwright personas  
- **Esperado:** fluxos seller publish/estoque/cart exercitados  
- **Obtido:** spec só valida credentials; TCS 64.7%, PCS 12.5% (3/24)  
- **Evidência:** `testing/reports/coverage-latest.json`, `persona-flows.spec.ts`  
- **Impacto:** regressões de UI seller passam despercebidas  

### [P2] MTG/Pokémon não LIVE — Marina vê tabs mas provider não está marketplace-visible

- **Ambiente:** ops + registry  
- **Esperado:** tabs desabilitadas ou copy “em breve” coerente com lifecycle  
- **Obtido:** wave habilita mtg/pokemon; lifecycle = SHADOW / IMPLEMENTED(OFF)  
- **Impacto:** busca vazia / sync off → frustração  
- **Arquivos:** `CatalogSyncService`, `GameSelectorTabs` + `isCatalogGameEnabled`  

### [P2] ListingPublishWizard — preço sugerido do catálogo na UI de publish

- **Ambiente:** código  
- **Fluxo:** publicar anúncio  
- **Esperado:** catálogo sem preço (ADR-001); sugestão clara como overlay marketplace  
- **Obtido:** UI mostra `lowest_price_cents` como “Preço sugerido” ao lado da carta do catálogo  
- **Impacto:** risco de Marina achar que preço veio do catálogo canônico  
- **Arquivos:** `ListingPublishWizard.tsx`  

### [P3] Warnings ESLint massivos no build FE

- **Impacto:** ruído; não bloqueia após fix `CatalogGameSlug`  
- **Evidência:** log Vercel / `npm run lint`  

---

## Problemas de performance

| Fluxo | Tempo | Resultado |
| --- | --- | --- |
| Login (in-memory) | 38ms / budget 150ms | PASS |
| Publish listing | 14ms / budget 250ms | PASS |
| Listing → search | 1ms / budget 5000ms | PASS |
| Get offers | 2ms / budget 100ms | PASS |
| Abrir busca/PDP UI | N/A | **Não medido** (sem servidor) |
| Publicar no browser | N/A | **Não medido** |

---

## Problemas de imagem/carregamento

| Tela | Problema | Impacto |
| --- | --- | --- |
| Wizard (código) | `Image` com `unoptimized`; alt vazio | A11y / LCP (P2 potencial) |
| PDP live | Não testado | — |

---

## Inconsistências de estoque

| Produto | Esperado | Obtido | Impacto |
| --- | --- | --- | --- |
| Inventory qty=3 (golden path) | Persistido no domínio | PASS in-memory | — |
| Reserva checkout / reserved_stock | Consistente após retry | Histórico P0 Beta (não retestado) | Alto se staging ainda órfão |

---

## Inconsistências de relatório

| Relatório | Esperado | Obtido | Impacto |
| --- | --- | --- | --- |
| Seller analytics | Dados de pedidos | Mock | Alto para operação diária |
| North Star LPC/LCS | Só Beta real | 0 / não tocado | Correto |

---

## Correções recomendadas

### P0
1. **Subir stack local/staging** e reexecutar Ciclo 1 Lorcana UI (smoke + Playwright).  
2. **Revalidar** cart `tcg_id` + race `shopping_carts` em **staging** (não Beta) com persona determinística.  
3. Confirmar deploy do patch estoque/reserva em staging.

### P1
1. Alinhar `IMPLEMENTATION_WAVE_*` e `CATALOG_GAME_SLUGS` à **ADR-013** (remover denylist; YGO/FAB fora até ADR).  
2. Trocar mock de analytics por read model real em staging (sem feature nova — wiring).  
3. Expandir `persona-flows.spec.ts` para publish + cart (local only).

### P2
1. Desabilitar tabs MTG/Pokémon até Canary/Live **ou** copy explícita de lifecycle.  
2. Renomear “Preço sugerido” para deixar claro que é overlay de marketplace.

### P3
1. Limpar warnings ESLint críticos de unused em rotas seller.

---

## Checkpoint humano

**Ciclo 1 (Lorcana UI live) — PAUSADO.**  
Motivo: sem servidor local/staging.  
Próximo passo humano: iniciar FE+API em staging/local autorizado e autorizar Ciclo 1b (20–30 min) com Marina.

Ciclos 2–6 **não iniciados** (dependem do 1b).

---

## Evidências de comando (local)

```text
✓ testing guard OK — env=local
✓ test:personas / test:compose (24 personas)
✓ TCS 64.7% · PCS 12.5% (engineering only)
✓ API: marketplace, checkout.e2e, lorcana, mtg, pokemon, performanceBudget
✓ FE: gameConfig.r2, cart, catalog-games, normalize listing
✗ test:smoke — localhost:3000 unreachable
```

---

## Prompt de correção para o Cursor

```text
Você é Platform Guardian do JudgeTCG.

Contexto: relatório QA persona Marina Costa (local/CI). NÃO tocar Beta/Produção.
NÃO alterar ADRs, North Star, LPC/LCS/SD. NÃO criar features novas.
Apenas correções mínimas de bug/regressão + testes.

Hierarchy: Constitution → ADRs → North Star → MVP → Sprint → Ops → Código.

Tarefas (nessa ordem):

1) P1 — Alinhar game-rollout e CATALOG_GAME_SLUGS à ADR-013:
   - Remover denylist (vanguard, swu, union-arena) da navegação seller.
   - Remover YGO/FAB da IMPLEMENTATION_WAVE até novo ADR.
   - Manter Lorcana/MTG/Pokémon/OP/DBFW/Digimon/Riftbound conforme lifecycle
     (tabs MTG/Pokémon: enabled só se policy explícita; senão disabled + “em breve”).
   Arquivos: frontend/runtime_console_v3/src/lib/game-rollout.ts,
   seller-product-categories.ts. Testes: catalog-games.test.ts + regressão GameSelectorTabs.

2) P2 — ListingPublishWizard: copy de “Preço sugerido” deixar explícito que NÃO é preço do catálogo
   (ADR-001). Sem mudar SoT.

3) P1 — Expandir testing/playwright/persona-flows.spec.ts (local only + assert-not-beta):
   seller-alpha: login → abrir wizard → buscar staple Lorcana → assert lista;
   buyer-alpha: busca Rapunzel (se BASE_URL staging/local up). Skip se SMOKE_SOFT.

4) NÃO implementar analytics real neste PR se exigir BC novo — abrir issue/debt TD no
   TECHNICAL_DEBT_REGISTER apenas se já não existir.

Validação: npm run test --prefix services/api (subset seller/catalog),
FE vitest catalog-games + gameConfig.r2, test:personas, guard local.
Rollback: reverter o PR.
```

---

**Assinatura QA:** Marina Costa (persona) · Ambiente local · 2026-07-20 · Ciclo 1 parcial
