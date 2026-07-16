# Sprint 7.4 — Cart → Checkout Start

**Status:** Entregue  
**Fecha o loop buyer:** oferta → carrinho → `CheckoutSession CREATED`

## Rotas

| Rota | Função |
|------|--------|
| PDP ofertas | `[Adicionar ao carrinho]` |
| `/cart` | Snapshot comercial · qty · remover · Continuar compra |
| `/checkout?session=` | Confirmação CREATED (pay = Sprint 9) |

## APIs

`checkoutApi.createCart` · `addCartItem` · `removeCartItem` · `getCart` · `startCheckout`

Persistência: `cartId` + display meta em `sessionStorage` (nomes/loja; preço vem do snapshot da API).

## Analytics

`buyer_add_to_cart` · `buyer_checkout_started`

## Local

```bash
# stack unificado Identity+Marketplace+Order
AUTH_API_PORT=8789 npm run api:checkout
npm run api:public   # :8787
```

## Bloqueado

Pagamento real · frete · cupom · multi-seller complexo
