# Smoke Test Resultado — 2026-06-20

## Status: ⏳ PENDENTE (manual)

O smoke test **completo (17 passos no browser)** ainda não foi executado por um humano.  
As verificações abaixo foram feitas automaticamente pelo Cursor em **2026-06-20 ~15:35 BRT**.

**Commit de referência:** `0d1da939` (main)

---

## Etapa 1 — Secrets (não verificável via API)

Dashboards Render/Vercel/Stripe **não são acessíveis** daqui. Use o checklist em [SMOKE_TEST.md](SMOKE_TEST.md).

### Indícios indiretos (API Render)

| Variável | Indício | Conclusão |
|----------|---------|-----------|
| `STRIPE_SECRET_KEY` | `POST /marketplace/shop/checkout` → **400** `"Carrinho vazio"` (não 503) | ✅ Provavelmente configurada |
| `STRIPE_WEBHOOK_SECRET` | Webhook exige assinatura | ⬜ Confirmar `whsec_` no Render = Dashboard test |
| `MARKETPLACE_APP_URL` | — | ⬜ Verificar manualmente no Render |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | — | ⬜ Verificar manualmente na Vercel |
| `API_PROXY_TARGET` | BFF `/api/marketplace/shop/products` → 200 | ✅ Proxy OK |

---

## Etapa 2 — Deploy e URLs

| URL | HTTP | Observação |
|-----|------|------------|
| `https://judgetcg.com.br/marketplace` | 200 | OK |
| `https://judgetcg.com.br/store/dashboard` | 200 | Página carrega (auth no client) |
| `https://judgetcg.com.br/api/marketplace/shop/products` | 200 | BFF OK |
| `https://judgetcg.com.br/api/stores/mine` | 401 | Esperado sem login |
| `https://seekguidance.onrender.com/.../shop/products` | 200 | OK (~0,7s aquecido) |
| `POST .../stripe/webhook` (sem assinatura) | 400 | `"Missing Stripe-Signature"` — endpoint ativo |

**Vercel:** último deploy OK — workflow [27863588753](https://github.com/GCardoso26/seekguidance2/actions/runs/27863588753) (commit `428a7c65`, inclui CSP Stripe + `/stores/mine`).

**Render:** API responde; **cold start** pode levar >45s na primeira requisição após idle.

**Supabase:** `store_products` count = **0** (nenhum produto cadastrado ainda).

**CI GitHub:** pytest de integração falha (401 em testes Stripe) — **não bloqueia** deploy produção.

---

## Etapa 3 — Checklist manual (17 passos)

| Bloco | Passos | Status |
|-------|--------|--------|
| Loja + Connect | 1–6 | ⬜ Pendente |
| Produto + checkout | 7–12 | ⬜ Pendente |
| Pagamento + verificação | 13–17 | ⬜ Pendente |

### Roteiro rápido

1. Login → `/stores/create` → criar **Loja Teste**
2. `/store/dashboard` → aba **Stripe** → Conectar (test mode)
3. Aba **Produtos** → Sleeves YGO, **R$ 29,90** (= `2990` centavos no form), estoque 10, categoria `sleeve`
4. `/marketplace` → comprar → cartão `4242 4242 4242 4242`
5. Confirmar pedido `paid`, estoque 9, split ~85% no Stripe Dashboard

---

## Etapa 4 — Resultado final

| Resultado | Quando |
|-----------|--------|
| ✅ PASSOU | Todos os 17 passos ✅ — atualizar este arquivo |
| ❌ FALHOU | Anotar passo, erro do console/network, screenshot |

**Stripe Live:** 🚫 **NÃO ATIVAR** até status ✅ PASSOU em test mode.

---

## Histórico

| Data/Hora | Executor | Resultado |
|-----------|----------|-----------|
| 2026-06-20 15:35 | Cursor (auto) | Infra OK; manual pendente |
| | | |
