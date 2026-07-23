# CHECKOUT_PAYMENT_RENDER_VALIDATION.md

**Gerado:** 2026-07-22  
**Upstream:** `https://seekguidance2-66dz.onrender.com`

## FE wiring

| Ambiente | `CHECKOUT_V2_API_URL` | Evidência |
|----------|----------------------|-----------|
| **Vercel / prod** (`judgetcg.com.br`) | `seekguidance2-66dz.onrender.com` | Header BFF `X-Checkout-V2-Upstream: seekguidance2-66dz.onrender.com` em `POST /api/checkout-v2/cart` → **401** (auth OK; proxy OK) |
| **Local** `.env.local` | ainda `https://checkout-v2-api.judgetcg.com.br` | Desatualizado → CF **502** |

## API Render

| Check | Resultado |
|-------|-----------|
| `GET /health` | **200** `status=ok` ready |
| Auth register/login | **OK** |
| `POST /api/v1/checkout-v2/cart` | **201** |
| Add listing item | **200** (listing seed `76ba13ac-…`, R$ 10,00) |
| Session `paymentMethod=card` | **201** `payment_pending` + Stripe `paymentIntentId` `pi_…` + `clientSecret` |
| Session `paymentMethod=pix` | **409** Stripe: PIX não ativado na conta (`stripe_api_error: payment method type "pix" is invalid`) |
| Webhook `/webhooks/stripe` | Endpoint vivo (**400** em body vazio = parse fail esperado) |

## Pagamentos

| Método | Status |
|--------|--------|
| **Cartão (Stripe)** | **CONECTADO** — PaymentIntent real criado |
| **PIX (via Stripe)** | **FALHA de config Stripe Dashboard** — habilitar PIX em Payments settings |
| Mercado Pago gateway | Não exercitado nesta rodada (gateway ativo = Stripe via env) |

## Veredito

- Render Checkout V2 **operacional** e **ligado ao FE de produção**.
- Stripe **card** validado end-to-end até `clientSecret`.
- PIX bloqueado por configuração da conta Stripe (não por URL/proxy).
- Corrigir `.env.local` local para a URL Render se for testar checkout no `npm run dev`.
