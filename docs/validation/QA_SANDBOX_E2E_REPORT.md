# QA Sandbox — Relatório E2E Funcional (Analista Funcional)

**Data:** 2026-07-15  
**Ambiente:** `http://localhost:3000` com `NEXT_PUBLIC_APP_MODE=sandbox`  
**Backend proxy:** `API_PROXY_TARGET` / health ok (DB via API)  
**Personas usadas:** guest · `test-buyer@judgetcg.com` · `test-seller@judgetcg.com` · cadastro novo de teste  
**Método:** Playwright Chromium headless · navegação real · dados válidos/inválidos · captura de rede/console · screenshots em `frontend/runtime_console_v3/test-results/qa-sandbox/`  
**Scripts:** `scripts/qa-sandbox-e2e.mjs` + deep-dive / round2–5  

**Decisão:** **NO-GO** para considerar o sandbox funcionalmente estável para compra/venda E2E completa.

---

## 1. Resumo executivo

| Métrica | Valor |
|---|---:|
| Casos rodada 1 (suíte ampla) | 64 |
| PASS (r1) | 53 |
| FAIL (r1) | 2 |
| WARN (r1) | 7 |
| BLOCKED (r1) | 2 |
| Achados P0 novos/confirmados (todas rodadas) | 4 |
| Achados P1 | 8 |
| Achados P2 | 6 |

O sandbox **abre e autentica**, mas o caminho de compra/venda quebra por: **rate-limit 429 intermitente**, **busca de catálogo degradada**, **painel seller travado em loading**, **KYC CPF obrigatório sem fluxo resiliente**, e **sinais de demo** (badge SANDBOX + badges Pedidos 12 / Atendimento 3).

---

## 2. Escopo testado (checklist)

### Guest
- [x] Home, Loja, Loja MTG, Busca, Carrinho, Checkout, Decks, Games
- [x] Políticas (compra/cancelamento/reembolso/marketplace), Termos, Privacidade, Suporte
- [x] `/entrar`, legado `/login`, 404, admin gate, alerts/notifications/leaderboard
- [x] Links internos da home (24) — nenhum 5xx
- [x] Busca XSS payload na query
- [x] `/stores/create` sem login (formulário **exposto**)

### Auth / Cadastro
- [x] Submit vazio → validação HTML5
- [x] Email inválido (`x@`)
- [x] Credenciais inexistentes
- [x] Senha fraca no registro (&lt;8)
- [x] Tentativa de criar conta nova
- [x] Login programático buyer/seller (Supabase)

### Buyer
- [x] `/perfil`, carrinho, checkout autenticados
- [x] Trust footer CNPJ no carrinho/checkout (quando página carrega)
- [x] `/comprador`, `/comprador/financeiro`
- [x] Add-to-cart tentativa na listagem
- [x] `/completar-perfil` + status `pending_cpf`
- [x] CTA CPF inválidos (botão permanece disabled)

### Seller
- [x] Painel, estoque, listagens, nova, CSV, financeiro, financeiro-platform, eventos, insights
- [x] `/stores/create` preenchimento + submit
- [x] Badges demo no nav
- [x] `/admin/console` como seller → redirect login

### APIs
- [x] `/api/health`, catalog health/sets/search, sandbox status, analytics track, account status

---

## 3. Bugs e inconsistências (priorizados)

### P0 — bloqueiam jornada

| ID | Área | O que foi feito | Erro encontrado | Evidência |
|---|---|---|---|---|
| **QA-001** | Catálogo / Busca | `GET /api/catalog/cards/search?q=…` sob carga e na UI `/loja/busca` | Resposta `200` com `degraded:true` / `catalog_search_unavailable` / `upstream_status:429` → **zero resultados**; loja/busca/home featured vazios. Health diz `ready_for_marketplace:true` (131k cards) — **inconsistência**. Após cooldown, search voltou a responder. | round2/3/deep-dive JSON; screenshots `busca-guest.png` |
| **QA-002** | Seller painel | Abrir `/vendedor/painel` (seller autenticado), aguardar até 20s | UI permanece em **“Carregando painel…”** de forma persistente | `s2-painel.png`, `painel-after-cooldown.png` |
| **QA-003** | Rate limit cascata | Seqüência de navegação autenticada | `429 Muitas consultas…` em `/api/account/status`, search, sandbox status → telas em **Carregando…** sem recovery | round2 `B2-ACCOUNT-STATUS` |
| **QA-004** | Compra E2E | Buyer `account_status=pending_cpf`, `can_purchase=false` | Compra real bloqueada até CPF; completar-perfil **hang** sob 429 | account status JSON; completar-perfil screenshots |

### P1 — graves / confiança

| ID | Área | O que foi feito | Erro encontrado |
|---|---|---|---|
| **QA-005** | Seller nav | Abrir listagens com seller **sem loja** | Badges hardcoded **“Pedidos 12”** e **“Atendimento 3”** — cheiro de demo |
| **QA-006** | Sandbox percepção | Navegar `/loja` guest e autenticado | Badge **SANDBOX** no header do hot path comprador (ok p/ sandbox; risco de vazamento p/ prod) |
| **QA-007** | Cadastro loja | `POST` implícito via UI `/stores/create` | Botão fica em **“Criando…”**; interceptou `POST /api/proxy/.../growth/event` **500**; create pode não concluir / sem feedback de erro claro |
| **QA-008** | Guest store create | Abrir `/stores/create` deslogado | Formulário **totalmente utilizável sem auth** (deveria gatear para `/entrar`) |
| **QA-009** | Auth UX | Login com credenciais inválidas | Mensagem crua em inglês: **“Invalid login credentials”** |
| **QA-010** | Legado login | Abrir `/login` | Página legado **ainda existe** sem redirecionar claramente para `/entrar` |
| **QA-011** | Seller onboarding | Estoque sem loja | CTA “Cadastrar loja” correto, mas painel root hung impede descoberta |
| **QA-012** | Asset | Navegação geral | `GET /brand/mark.svg` → **404** (log do server) |

### P2 — qualidade / i18n / resiliência

| ID | Área | Achado |
|---|---|---|
| **QA-013** | Validação HTML | Mensagens nativas do browser em inglês (`Please fill out this field.`) |
| **QA-014** | Analytics | `POST /api/analytics/track` com `events:[]` → soft 200 `ok:false` (esperado), ok |
| **QA-015** | Sets API | Inicialmente `sets:[] degraded`; depois ok — **instável** |
| **QA-016** | Add to cart | CTA clicado na busca; carrinho permaneceu sem item claro (lista vazia / catálogo falho) |
| **QA-017** | Hub comprador | `/comprador` conteúdo fraco / possível gate incompleto |
| **QA-018** | Performance lab | Rotas 15–19s (`/completar-perfil`, `/stores/create`) sob Sentry/OTEL noise |

---

## 4. Matriz de execução — Rodada 1 (resumo por módulo)

### 4.1 APIs
| ID | Passos | Status | Resultado |
|---|---|---|---|
| API health | GET `/api/health` | PASS | 200 ok |
| Catalog health | GET `/api/catalog/health` | PASS | 131526 cards, ready |
| Catalog sets | GET `/api/catalog/sets` | PASS* | *degraded vazio na 1ª amostra |
| Catalog search | GET search `q=bolt` | PASS* | *200 degraded empty — comportamento incorreto p/ usuário |
| Sandbox status | GET `/api/sandbox/status` | PASS | game_slug sandbox |
| Analytics track | POST events=[] | PASS | soft-fail 200 |

### 4.2 Guest / rotas
| ID | Rota / ação | Status | Nota |
|---|---|---|---|
| G-HOME … G-404 | 27 rotas públicas | PASS (exceto login legado WARN) | Políticas e suporte ok |
| G-LOGIN-LEGACY | `/login` | WARN | Sem fluxo claro → `/entrar` |
| G-HOME-LINKS | 24 links home | PASS | Sem 5xx |
| G-BUSCA-XSS | query script | PASS | Sem execução óbvia / soft |

### 4.3 Auth
| ID | Passos | Status | Erro |
|---|---|---|---|
| A-INVALID-FORM (r1) | Abrir `/entrar` cedo demais | FAIL (flaky) | Inputs ainda não hidratados — **reteste PASS** com wait |
| A2-EMPTY | Submit vazio | PASS | HTML5 required |
| A2-BAD-EMAIL | `x@` | PASS | Validação incompleto após @ |
| A2-BAD-CREDS | user inexistente | WARN | Texto EN |
| A2-WEAK-PASS | senha 7 chars | PASS | minLength 8 |
| A2-REGISTER | criar conta nova | WARN | Erro/constraint no email de teste / ficou em `/entrar` |

### 4.4 Buyer
| ID | Passos | Status | Erro |
|---|---|---|---|
| B-SEARCH / PDP | Buscar Lightning → abrir PDP | FAIL/WARN | Sem produtos (search degradado); redirect atípico p/ completar-perfil em uma tentativa |
| B-CART/CHECKOUT guest | Abrir carrinho/checkout | PASS/WARN | Trust footer PASS; empty/login UX ambígua |
| B-AUTH-* | buyer login cookie | PASS | Perfil, cart, checkout, trust |
| B-FINANCEIRO | Abrir shell financeiro | WARN | Shell visitável / dual ledger risk |
| B-ADD-CART | Clicar adicionar | WARN | Sem item claro no carrinho |
| B2-COMPLETAR-PERFIL | Abrir KYC sob 429 | FAIL | Hang Carregando… |
| B2 (cooldown) | Reabrir completar-perfil | PASS | Form CPF aparece |
| CPF inválido | `111…`, `123`, `000…` | PASS (validação) | Botão **disabled** até CPF aparentemente válido |

### 4.5 Seller
| ID | Passos | Status | Erro |
|---|---|---|---|
| S-PAINEL | Abrir painel | FAIL | Loading infinito |
| S-LIST / S-NOVA / etc. | Rotas laterais | PASS/WARN | Listagens carrega; nova “Buscando…” sem catálogo |
| S-NOVA-INVALID | Submit sem carta | BLOCKED | Sem botão salvar até selecionar carta (OK UX) mas catálogo quebrado |
| S2-DEMO-BADGES | Inspecionar nav | FAIL | Pedidos 12 / Atendimento 3 |
| S2-LOJA create | Preencher + Cadastrar | WARN/FAIL | Travado em Criando…; growth event 500 |
| Guest create store | Abrir form | FAIL (security UX) | Sem gate de login |

---

## 5. Simulações realizadas (dados)

| Cenário | Dados | Esperado | Observado |
|---|---|---|---|
| Login vazio | — | Bloquear | Bloqueou (HTML5) |
| Email inválido | `x@` | Bloquear | Bloqueou |
| Login inválido | `nobody-qa@…` / WrongPass | Erro amigável PT | Erro EN Supabase |
| Senha fraca registro | 7 chars | Bloquear | Bloqueou minLength |
| Busca XSS | `<script>alert(1)</script>` | Escape / empty | Página estável |
| CEP inválido | — | Validar | Campo ausente (guest checkout) — BLOCKED |
| CPF inválidos | 111…, 123, 000… | Rejeitar | Botão disabled |
| Create store inválido | `bad value @@` | Mensagens | Pouco feedback app-level |
| Create store plausível | Nome/slug/email/cidade | Loja criada | Travou Criando… |
| Search válido | Lightning Bolt | Lista cartas | Vazio sob 429; ok após cooldown |

---

## 6. Conta de teste — estado real

```json
{
  "player": {
    "account_status": "pending_cpf",
    "cpf_last4": null,
    "cpf_verified": false,
    "can_purchase": false
  },
  "merchant": null
}
```

**Impacto:** buyer e seller de QA **não conseguem completar compra nem merchant onboarding** sem validar CPF; quando status API rate-limita, a UI de completar perfil fica inutilizável.

---

## 7. O que passou bem

- Health geral FE + muitas rotas públicas **200** com conteúdo legal/políticas.
- Auth Supabase cookie E2E funcional para buyer/seller.
- Carrinho/checkout autenticados renderizam e **trust legal** (CNPJ) detectável.
- Gate HTML5 de email/senha ok.
- Seller shells (listagens/financeiro/eventos) montam **quando não dependem do painel root hanging**.
- Analytics track soft-200 (não polui com 5xx).
- XSS query não quebrou a página.

---

## 8. Riscos para produção (mesmo sendo sandbox)

1. Badge **SANDBOX** e counters demo **não podem** vazar com `APP_MODE=production`.
2. Rate-limit **429** sem UI de retry quebra KYC e busca.
3. Health “ready” vs search vazio → falsa confiança operacional.
4. `/stores/create` aberto a guest.
5. Mensagens de auth em inglês no fluxo PT-BR.

---

## 9. Recomendações (ordem)

1. **P0** Estabilizar catalog search (Meili/upstream) + UI “catálogo indisponível / tentar de novo” (não página em branco).
2. **P0** Corrigir hang `/vendedor/painel` (“Carregando painel…”).
3. **P0** Backoff/retry UX em `/api/account/status` e completar-perfil.
4. **P1** Remover badges demo Pedidos/Atendimento; garantir badge SANDBOX só fora de production.
5. **P1** Gate auth em `/stores/create`; timeout/error no `useCreateStore` (não ficar eternamente em Criando…).
6. **P1** Localizar erros Supabase (`Invalid login credentials` → PT).
7. **P1** Redirect `/login` → `/entrar`.
8. **P2** Corrigir `/brand/mark.svg` 404.

---

## 10. Artefatos

| Artefato | Caminho |
|---|---|
| Relatório (este) | `docs/validation/QA_SANDBOX_E2E_REPORT.md` |
| JSON rodada 1 | `docs/validation/QA_SANDBOX_E2E_REPORT.json` |
| Screenshots / dumps | `frontend/runtime_console_v3/test-results/qa-sandbox/` |
| Scripts reexecutáveis | `frontend/runtime_console_v3/scripts/qa-sandbox-*.mjs` |

---

## 12. Hotfix P0 (2026-07-15) — search → painel → KYC

| ID | Fix | Status verificação local |
|---|---|---|
| QA-001 | Meili `None` fallback (API); buckets `catalog_read`/`account_read`; BFF retry 429; UI trata `degraded` ≠ “0 resultados”; search RL FE 60/min | Search API + UI com resultados (9 cards Lightning Bolt) |
| QA-002 | Layout fail-open (erro/timeout 12s); root não bloqueia em `overviewLoading`; overview BFF com `fetchApiResilient` | Painel sai de “Carregando…” e monta shell + CTA |
| QA-003/004 | `useAccountStatus` timeout/retry/`staleTime`; BFF status resilient; `/completar-perfil` fail-open no form + retry | Form CPF renderiza; status 200 |

**Nota:** buckets Meili/rate-limit no FastAPI exigem **redeploy do backend** (Render) para valer em produção; FE sandbox já consome os fixes de UI/BFF.
