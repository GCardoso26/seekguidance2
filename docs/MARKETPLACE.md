# Marketplace MVP — Arquitetura e Deploy

Última atualização: 2026-06-20

## Escopo

Marketplace de **produtos físicos** (sleeves, deck boxes, playmats, boosters, acessórios) com checkout Stripe e split 85% loja / 15% Judge TCG.

**Fora do MVP:** singles com condition, leilão, frete Correios, devoluções, avaliações de produto.

O marketplace de **decklists** (`marketplace_decklists`) permanece intacto na aba Decklists em `/marketplace`.

## Decisões de arquitetura

| Decisão | Motivo |
|---------|--------|
| Reutilizar `tcg_judge.stores` | Já existia (Fase 5): `owner_id`, slug, verificação. Evita duplicar lojas. |
| Novas tabelas com prefixo `shop_` / `store_` | `store_products`, `shopping_carts`, `shop_orders`, `shop_order_items` — não conflitam com decklists. |
| `owner_id TEXT` → `player_profiles` | Alinhado ao schema existente (não `auth.users` direto nas FKs de loja). |
| Preços em **centavos** (`price_cents`) | Consistente com `marketplace_decklists.price_cents` e Stripe (`amount` em centavos). |
| Comissão em `stores.commission_rate` | Default `0.15` (15%). Transfer Stripe = `amount × (1 - commission_rate)`. |
| Webhook reutiliza billing | `POST /runtime/judge/stripe/webhook` — evento `payment_intent.succeeded` com metadata `store_splits`. |
| BFF Next.js | Rotas `/api/marketplace/shop/*` → API Render com header `X-Judge-User-Id`. |

## Schema (migration `20260619160000_marketplace_shop_mvp.sql`)

Colunas novas em `stores`:

- `stripe_account_id`, `stripe_onboarding_complete`, `commission_rate`, `shop_enabled`, `cnpj`

Tabelas:

- `store_products` — catálogo por loja
- `shopping_carts` — 1 carrinho por `user_id` (JSONB `items`)
- `shop_orders` + `shop_order_items` — pedidos pós-pagamento

## API (FastAPI)

Prefixo: `/runtime/judge/marketplace/shop/`

| Rota | Função |
|------|--------|
| `GET /products` | Grid público com filtros |
| `GET /products/{id}` | Detalhe |
| `POST /stores/{id}/products` | CRUD lojista |
| `GET/POST /cart` | Carrinho |
| `POST /checkout` | PaymentIntent |
| `POST /connect/onboard` | Stripe Connect Express |
| `GET /stores/{id}/dashboard` | Stats lojista |

## Frontend (Next.js)

| Rota | Página |
|------|--------|
| `/marketplace` | Abas Produtos + Decklists |
| `/marketplace/product/[id]` | Detalhe |
| `/marketplace/loja/[slug]` | Loja |
| `/marketplace/cart` | Carrinho |
| `/marketplace/checkout` | Stripe Elements |
| `/store/dashboard` | Dashboard lojista |
| `/store/onboarding` | Redirect Connect |

## Variáveis de ambiente

### API (Render)

```env
STRIPE_SECRET_KEY=sk_test_...          # teste primeiro; live depois
STRIPE_WEBHOOK_SECRET=whsec_...
MARKETPLACE_APP_URL=https://judgetcg.com.br
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
```

### Frontend (Vercel)

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
API_PROXY_TARGET=https://seekguidance.onrender.com
NEXT_PUBLIC_APP_URL=https://judgetcg.com.br
```

> `NEXT_PUBLIC_API_URL` não é usado pelo BFF atual — o proxy server-side usa `API_PROXY_TARGET`.

## Webhook Stripe

**URL de produção hoje (API no Render):**

```
https://seekguidance.onrender.com/runtime/judge/stripe/webhook
```

Eventos mínimos:

- `payment_intent.succeeded` (marketplace)
- `checkout.session.completed`, `invoice.paid`, … (billing Pro)

> `https://api.judgetcg.com.br/...` **não está ativo** até DNS/proxy apontar para o serviço Render.

## Deploy

```bash
# 1. Migrations
cd supabase && supabase link --project-ref rjgzaakhzuzdzcooywva && supabase db push

# 2. API — git push main → Render auto-deploy

# 3. Frontend — push main dispara GitHub Action "Vercel Deploy Hook"
#    ou: cd frontend/runtime_console_v3 && vercel deploy --prod
```

## Smoke test E2E (Stripe test mode)

1. Login → `/stores/create` → criar loja
2. `/store/dashboard` → Stripe Connect (test)
3. Cadastrar produto (ex.: Sleeves YGO, R$ 29,90)
4. `/marketplace` → comprar → cartão `4242 4242 4242 4242`
5. Dashboard lojista → pedido `paid`; Stripe Dashboard → transfer ~85%

## PR

Mergeado em `main` via [PR #2](https://github.com/GCardoso26/seekguidance2/pull/2) (`64ef3ba`).
