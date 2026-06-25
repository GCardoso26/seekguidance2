# API Lojista — Judge TCG

Base URL: `https://seekguidance.onrender.com/public/v1`

Autenticação: header `X-API-Key: jtcg_live_...`

Disponível para lojistas com **plano Pro** ou superior.

## Criar chave (painel ou sessão autenticada)

```http
POST /public/v1/developer/api-keys
X-Judge-User-Id: {user_id}
```

Resposta inclui `apiKey` (mostrada uma vez).

## Loja

```http
GET /public/v1/seller/store
X-API-Key: jtcg_live_...
```

## Produtos

```http
GET /public/v1/seller/products?limit=50
X-API-Key: jtcg_live_...
```

## Pedidos

```http
GET /public/v1/seller/orders?limit=50
X-API-Key: jtcg_live_...
```

Campos úteis: `status`, `total_cents`, `use_escrow`, `payment_method`.

## BuyList (painel web)

1. `POST /runtime/judge/marketplace/shop/stores/{storeId}/buylists` — criar oferta
2. Compartilhar `/buylist/{token}`
3. Cliente: `POST .../buylists/public/{token}/submit`
4. Lojista aceita: `PATCH .../buylists/submissions/{id}` com `{ "status": "accepted" }`
5. Gera `shop_order` com `use_escrow=true` e escrow para o vendedor da coleção

## Rate limit

Headers de resposta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`.

## Crons (produção)

| Job | Vercel (diário) | Render |
|-----|-----------------|--------|
| Escrow auto-actions | 06:00 UTC | via proxy |
| Alertas de preço | 07:00 UTC | API direta |
