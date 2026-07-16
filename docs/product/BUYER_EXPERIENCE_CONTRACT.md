# Buyer Experience Contract — Sprint 7

**Status:** Congelado antes do frontend — Sprint 7  
**Relaciona:** [`SELLER_EXPERIENCE_CONTRACT.md`](./SELLER_EXPERIENCE_CONTRACT.md) · [`READ_MODEL_CONTRACT.md`](../architecture/READ_MODEL_CONTRACT.md) · [`CHECKOUT_API_CONTRACT.md`](../architecture/CHECKOUT_API_CONTRACT.md) · [ADR-007](../architecture/adr/ADR-007-marketplace-domain-boundaries.md)

## Princípio

Comprador encontra carta oficial + ofertas comerciais **sem misturar SoT**.

```text
Buscar → Carta oficial (Catalog) → Ofertas (Marketplace) → Carrinho → Checkout
```

Frontend só consome Public API + Marketplace read + Checkout API autenticada.

## Regra arquitetural

```text
Frontend → PublicApiClient / MarketplaceApiClient / CheckoutApiClient / AuthApiClient
```

Nunca Catalog/Order repositories.

## Jornada do comprador

```text
1. Buscar carta
2. Abrir página da carta
3. Ver bloco CATALOG (oficial) separado de OFERTAS
4. Adicionar oferta ao carrinho
5. Ver carrinho
6. Iniciar checkout (pay fica mínimo / Fake até Sprint 9)
```

## Telas permitidas

| Rota | Propósito |
|------|-----------|
| `/` ou `/search` | Busca + resultados |
| `/cards/:id` | PDP — Catalog | Ofertas (ADR-007) |
| `/cart` | Carrinho mínimo |
| `/checkout` | Finalizar (auth) |
| `/login` · `/register` | Auth |

### PDP — separação visual obrigatória

```text
──────── CATALOG ────────
Nome · Imagem · Oracle · Set · Rarity
(dados oficiais — Search/Public API)

──────── OFERTAS ────────
Loja · Condição · Idioma · Preço
(Marketplace offers — nunca misturar no bloco oficial)
```

## APIs

| Ação | API |
|------|-----|
| Busca | `GET /api/v1/search` |
| Carta | `GET /api/v1/cards/:id` (Public) |
| Ofertas | `GET /api/v1/marketplace/cards/:id/offers` |
| Cart / Checkout | `/api/v1/cart` · `/api/v1/checkout` · pay/webhook conforme 5.4/5.5 |

## Eventos de produto (funil buyer)

| Evento | Quando |
|--------|--------|
| `buyer_search` | Submit busca |
| `buyer_card_open` | Abre PDP |
| `buyer_offers_viewed` | Ofertas renderizadas |
| `buyer_add_to_cart` | Add oferta |
| `buyer_checkout_started` | Start checkout |

## Fora de escopo

❌ Wishlist · chat · avaliações · frete · cupom · multi-seller complexo · dashboard comprador

## Definition of Done (buyer half)

- [x] Busca retorna resultados
- [x] PDP separa Catalog vs Ofertas
- [x] Add to cart + ver carrinho
- [x] Checkout iniciado com JWT
- [x] Empty / loading / error states
