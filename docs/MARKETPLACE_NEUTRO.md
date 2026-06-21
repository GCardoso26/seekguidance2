# Marketplace Neutro — Judge TCG

## Modelo de negócio

| Aspecto | Modelo anterior | Modelo neutro |
|---------|-----------------|---------------|
| Pagamento padrão | Stripe Connect (split 85/15) | **PIX direto** ao lojista |
| Comissão sobre vendas | 15% | **0%** |
| Stripe Connect | Obrigatório | **Opcional** (cartão) |
| Receita da plataforma | Comissão | **Assinatura Pro Loja** (R$ 49/mês) |

## Configuração do lojista

1. Criar loja em `/stores/create`
2. **Pagamentos** → configurar chave PIX (obrigatório para vender)
3. (Opcional) Conectar Stripe para aceitar cartão
4. Assinar **Pro Loja** em `/store/pro` (produtos ilimitados)

## Checkout do comprador

1. Carrinho → Checkout
2. **PIX** (padrão): QR code + copia e cola → pagamento direto ao lojista
3. **Cartão** (se lojista tiver Stripe Connect completo)
4. Confirmação automática via webhook (OpenPix) ou manual no dashboard

## Pro Loja

| Plano | Preço | Limite produtos |
|-------|-------|-----------------|
| Free | R$ 0 | 20 |
| Pro | R$ 49/mês | Ilimitado |
| Enterprise | R$ 199/mês | Ilimitado |

Pagamento: Stripe (cartão recorrente) ou PIX único para a plataforma.

## API principal

| Endpoint | Descrição |
|----------|-----------|
| `PUT .../payment-settings` | Salvar PIX |
| `GET .../pix-webhook-status` | Status do gateway |
| `POST .../checkout/pix` | Gerar pedido + QR PIX |
| `POST .../pix/webhook` | Webhook confirmação PIX |
| `POST .../subscribe/checkout` | Checkout Pro (cartão/PIX) |
| `GET .../orders?status=` | Pedidos com filtros |
| `PUT .../orders/{id}/status` | Fulfillment + rastreio |
| `POST .../reviews` | Avaliação pós-compra |
| `POST .../coupons/validate` | Validar cupom |

Ver também: [WEBHOOK.md](./WEBHOOK.md)

## Variáveis de ambiente (API)

```env
OPENPIX_API_KEY=
OPENPIX_WEBHOOK_SECRET=
PLATFORM_PIX_KEY=
PLATFORM_PIX_KEY_TYPE=random
PIX_WEBHOOK_INTERNAL_SECRET=
STRIPE_PRICE_STORE_PRO=
STRIPE_PRICE_STORE_ENTERPRISE=
MARKETPLACE_APP_URL=https://judgetcg.com.br
```

## Documentação UI

Ver [UI_GUIDE.md](./UI_GUIDE.md) — componentes, fluxos e critérios de aceitação.

## Fluxos de avaliação

- Comprador: `/marketplace/orders` → `/orders/{id}/review`
- Loja pública: `/marketplace/loja/{slug}` (seção StoreReviews)
- Lojista: `/store/dashboard?tab=avaliacoes`

## Cupons

- Lojista: `/store/cupons`
- Checkout: validar via `POST .../coupons/validate`
- PIX: `POST .../checkout/pix` com `{ coupon_code, store_id }` — desconto persiste no pedido, PIX e `shop_coupon_uses`

## Performance

- Imagens via `next/image` (lazy, WebP)
- React Query com `staleTime` 30s nos dashboards
- Code splitting: gráficos e formulários pesados via `dynamic()`
- Meta SEO/Open Graph em `layout.tsx`

## Notificações

- Sino global no header + `/notifications` + `/settings/notifications`
- FCM: configurar `NEXT_PUBLIC_FIREBASE_*` (ver DEPLOYMENT.md)
