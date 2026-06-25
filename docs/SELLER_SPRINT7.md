# Sprint 7 — Analytics, estoque CSV, valuation, pagamentos adiados

## Entregas

### Pagamentos adiados até Go-Live
- `PAYMENTS_ENABLED=false` por padrão (`render.yaml`)
- Gate central em `app/marketplace/payments_gate.py`
- Health `/v1/health` → `services.payments`: `deferred` | `misconfigured` | `live`
- BuyList PIX, assinatura lojista PIX e escrow checkout respeitam o gate
- UI `BuylistPixPayment` mostra mensagem amigável quando `payments_deferred`

### Analytics lojista
- Estatísticas incluem pedidos `paid`, `processing`, `shipped`, `delivered`
- Página `/vendedor/painel/estatisticas` com gate de plano `analytics`

### Estoque — importação CSV
- `POST .../stores/{id}/inventory/import-csv`
- UI em `/vendedor/painel/estoque` com upload e modelo CSV

### Valuation por `card_id`
- `GET /runtime/judge/catalog/cards/{card_id}/valuation?condition=NM`
- Proxy Next.js `/api/valuation?card_id=...`
- `CardValuationPanel` prioriza `card_id` quando disponível

## Go-Live — habilitar pagamentos

No Render, configure:

```env
PAYMENTS_ENABLED=true
PLATFORM_PIX_KEY=sua-chave-pix
PLATFORM_PIX_KEY_TYPE=random   # ou cpf/cnpj/email/phone
OPENPIX_API_KEY=...            # opcional, gateway automático
```

Redeploy manual da API e do frontend (Vercel).

## Testes

```bash
cd services/api
pytest tests/marketplace/test_sprint7.py -q
```

## Deploy manual (billing GitHub Actions)

1. Render → Manual Deploy (commit Sprint 7)
2. Vercel → Redeploy `main`
