# Smoke Test E2E — Marketplace MVP

**Projeto:** judgetcg.com.br  
**Data:** 2026-06-20  
**Ambiente alvo:** Stripe **test mode** (não live)  
**Commit de referência:** pós-fix E2E (`feat/marketplace` + correções abaixo)

---

## Pré-requisitos

| Item | Status | Notas |
|------|--------|-------|
| Migration Supabase aplicada | ✅ | `store_products`, `shopping_carts`, `shop_orders`, `shop_order_items` confirmadas via CLI |
| `STRIPE_SECRET_KEY` no Render | ⬜ | Verificar manualmente — checkout retorna 500/503 se ausente |
| `STRIPE_WEBHOOK_SECRET` no Render | ⬜ | Webhook sem assinatura retorna **400** (esperado) |
| `MARKETPLACE_APP_URL` no Render | ⬜ | `https://judgetcg.com.br` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` na Vercel | ⬜ | Checkout mostra erro se ausente |
| `API_PROXY_TARGET` na Vercel | ⬜ | `https://seekguidance.onrender.com` |
| Webhook Stripe configurado | ⬜ | URL abaixo + evento `payment_intent.succeeded` |

**Webhook URL (produção hoje):**

```
https://seekguidance.onrender.com/runtime/judge/stripe/webhook
```

> `https://api.judgetcg.com.br/...` retorna **404** — DNS ainda não aponta para a API.

---

## Verificações automatizadas (2026-06-20 ~04:00 UTC)

| Check | Resultado | HTTP |
|-------|-----------|------|
| API listar produtos | `{"products":[],"page":1,"limit":20}` | 200 |
| BFF `/api/marketplace/shop/products` | JSON válido | 200 |
| Frontend `/marketplace` | Página carrega | 200 |
| Webhook sem `Stripe-Signature` | Rejeita payload | 400 |
| Checkout sem carrinho (user fake) | Erro interno (FK perfil — **corrigido** em commit E2E) | 500 → fix |

---

## Bugs corrigidos antes do smoke manual

| Bug | Impacto | Correção |
|-----|---------|----------|
| Dashboard usava `GET /api/stores` (lista pública) | Lojista via loja errada | `GET /api/stores/mine` |
| Carrinho/pedidos sem `player_profiles` | HTTP 500 no checkout | `ensure_player_profile()` |
| CSP bloqueava `js.stripe.com` | Stripe Elements não carrega | CSP atualizado (next.config + vercel.json) |
| Pós-criar loja → `/stores/{slug}` | Fluxo E2E quebrado | Redirect → `/store/dashboard` |
| Erros ao salvar produto silenciosos | Passo 8 falha invisível | Validação de resposta HTTP |

---

## Checklist E2E manual (12 passos)

> **Executar no browser** após configurar secrets e redeploy. Marcar ✅/❌.

| # | Passo | Esperado | Status |
|---|-------|----------|--------|
| 1 | Login (conta teste) | Logado, `/judge` | ⬜ |
| 2 | `/stores/create` | Formulário loja | ⬜ |
| 3 | Preencher nome, email, slug | Validação OK | ⬜ |
| 4 | Dashboard → aba **Stripe** → Conectar | Redirect Stripe Connect | ⬜ |
| 5 | Onboarding Stripe (test) | Conta Connect criada | ⬜ |
| 6 | `/store/dashboard` | Tabs visíveis, stats | ⬜ |
| 7 | Aba **Produtos** → Novo produto | Formulário | ⬜ |
| 8 | Sleeves YGO, R$ 29,90, estoque 10, sleeve | Produto salvo | ⬜ |
| 9 | `/marketplace` aba Produtos | Produto no grid | ⬜ |
| 10 | Detalhe do produto | Galeria + Comprar | ⬜ |
| 11 | Carrinho → checkout | Stripe Elements carrega | ⬜ |
| 12 | Cartão `4242 4242 4242 4242` | Pagamento OK → `/marketplace/checkout/success` | ⬜ |

---

## Verificações pós-pagamento

| # | Verificação | Onde | Esperado | Status |
|---|-------------|------|----------|--------|
| 13 | Pedido pago | `/store/dashboard` → Pedidos | status `paid` | ⬜ |
| 14 | Estoque | Aba Produtos | 9 (de 10) | ⬜ |
| 15 | Split loja | Stripe Dashboard test | Transfer ~R$ 25,42 (85%) | ⬜ |
| 16 | Comissão plataforma | Stripe Dashboard | ~R$ 4,48 (15%) | ⬜ |
| 17 | Carrinho vazio | `/marketplace/cart` | Sem itens | ⬜ |

---

## Se falhar

1. **Parar** — não ativar Stripe live  
2. **Debugar:** DevTools → Network; Vercel logs; Render logs; Stripe → Webhooks → eventos  
3. **Corrigir** → commit → push → aguardar redeploy  
4. **Repetir** checklist do passo 1  

### Erros comuns

| Sintoma | Causa provável |
|---------|----------------|
| "Stripe não configurado" no checkout | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ausente na Vercel |
| Elements não renderiza | CSP (verificar redeploy com fix Stripe) |
| Checkout 503 | `STRIPE_SECRET_KEY` ausente no Render |
| Pedido fica `pending` | Webhook não configurado ou secret errado |
| Produto não aparece no grid | Loja sem `shop_enabled` — completar Connect onboarding |

---

## Stripe Live

**NÃO ativar** até todos os 17 itens acima estarem ✅ em **test mode**.

Ver [MARKETPLACE.md](MARKETPLACE.md) seção "Stripe Live".

---

## Histórico de execuções

| Data | Executor | Resultado | Notas |
|------|----------|-----------|-------|
| 2026-06-20 | Cursor (automático) | Parcial | Infra OK; E2E browser pendente secrets + redeploy pós-fix |
| | | | |
