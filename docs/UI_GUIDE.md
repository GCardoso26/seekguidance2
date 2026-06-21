# UI Guide — Marketplace Judge TCG

## Componentes reutilizáveis

### Avaliações (`components/reviews/`)

| Componente | Uso |
|------------|-----|
| `ReviewStars` | Estrelas interativas 1–5 com labels |
| `ReviewForm` | Formulário pós-compra (fotos via Supabase Storage) |
| `ShopReviewCard` | Card de avaliação com resposta da loja |
| `ReviewList` | Lista paginada |
| `ReviewDistribution` | Barras por estrela |
| `StoreReviews` | Seção completa na loja pública |

### Notificações (`components/notifications/`)

| Componente | Uso |
|------------|-----|
| `GlobalNotificationBell` | Header global + dropdown |
| `NotificationPreferences` | Toggles push/email |

Páginas: `/notifications`, `/settings/notifications`

### Cupons (`components/coupons/`)

| Componente | Uso |
|------------|-----|
| `CouponForm` | Criar cupom (lojista) |
| `CouponList` | Listar/desativar |
| `CouponApply` | Checkout comprador |

Página lojista: `/store/cupons`

### Checkout PIX (`components/checkout/`)

| Componente | Uso |
|------------|-----|
| `PixTimer` | Contador regressivo colorido |
| `PixStatusRealtime` | Polling 5s + confetti |
| `PixShareActions` | Copiar, compartilhar, baixar QR |
| `EnhancedPixCheckoutPanel` | Painel completo |

### Dashboard (`components/dashboard/`)

| Componente | Uso |
|------------|-----|
| `KpiCards` | Vendas hoje/semana/mês, pendentes |
| `SalesChart` | Recharts — 30 dias |
| `ProStatusWidget` | CTA Free ou status Pro |
| `QuickActions` | Atalhos lojista |

## Fluxos

1. **Avaliar:** `/marketplace/orders` → Avaliar → `/orders/{id}/review`
2. **Loja pública:** `/marketplace/loja/{slug}` → `StoreReviews`
3. **Lojista:** `/store/dashboard?tab=avaliacoes` → responder/denunciar
4. **Cupons:** `/store/cupons` → checkout com `CouponApply`

## Critérios de aceitação

- Avaliação em ≤ 3 cliques após pedido entregue
- Notificações: sino + inbox `/notifications`
- Cupom: criar < 1 min, aplicar < 10s
- PIX: timer visível + polling automático
- Mobile: layout responsivo ≥ 375px
