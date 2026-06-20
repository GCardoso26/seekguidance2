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
4. (Opcional) Assinar Pro Loja para produtos ilimitados

## Checkout do comprador

1. Carrinho → Checkout
2. **PIX** (padrão): QR code + copia e cola → pagamento direto ao lojista
3. **Cartão** (se lojista tiver Stripe Connect completo)
4. Lojista confirma PIX manualmente no dashboard (webhook automático via gateway futuro)

## API

| Endpoint | Descrição |
|----------|-----------|
| `PUT .../stores/{id}/payment-settings` | Salvar PIX |
| `GET .../checkout/methods` | Métodos disponíveis |
| `POST .../checkout/pix` | Gerar pedido + QR PIX |
| `POST .../checkout` | Stripe (opcional) |
| `POST .../pix/webhook` | Confirmar pagamento PIX |
| `POST .../stores/{id}/subscribe` | Assinar Pro |

## Migration

`supabase/migrations/20260620180000_marketplace_neutro_pix_pro.sql`

## Lojistas existentes com Stripe Connect

Contas Connect existentes continuam funcionando para cartão, sem comissão da plataforma.
