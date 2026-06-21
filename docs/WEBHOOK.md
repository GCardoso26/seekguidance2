# Webhooks — Marketplace Neutro

## PIX — confirmação automática

**Endpoint:** `POST /runtime/judge/marketplace/shop/pix/webhook`

### Modos

| Modo | Variável | Comportamento |
|------|----------|---------------|
| OpenPix | `OPENPIX_API_KEY`, `OPENPIX_WEBHOOK_SECRET` | Cria cobrança + valida `X-OpenPix-Signature` |
| Asaas | `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` | Stub preparado para integração |
| Manual | (padrão) | Lojista confirma no dashboard ou `POST` com `{ "txid": "..." }` |

### Confirmação interna (fallback)

Header: `X-Pix-Webhook-Secret: <PIX_WEBHOOK_INTERNAL_SECRET>`

```json
{ "txid": "JTCGABC123" }
```

### Fluxo

1. Checkout PIX gera `pix_transactions` com `txid` único
2. Gateway notifica webhook → `confirm_pix_payment`
3. Pedido → `paid`, estoque decrementado, notificações `shop:pix_paid`
4. Histórico em `shop_order_status_history`

## Pro Loja — Stripe

**Checkout:** `POST .../stores/{id}/subscribe/checkout` com `{ "plan": "pro", "payment_method": "card" }`

Webhook Stripe (`checkout.session.completed`) com `metadata.kind = store_pro` ativa plano por 30 dias.

## Pro Loja — PIX plataforma

Requer `PLATFORM_PIX_KEY`. Gera `pix_transactions` com `gateway_provider = platform_pro`.

Confirmação via mesmo webhook PIX → ativa assinatura.

## Segurança

- Sempre validar assinatura HMAC do gateway em produção
- Nunca expor `PIX_WEBHOOK_INTERNAL_SECRET` no frontend
- Idempotência: reenvio de webhook retorna `{ "status": "paid" }` sem duplicar estoque
