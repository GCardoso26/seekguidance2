# Métricas Pós-Lançamento

Integração ClickHouse + Grafana planejada para Mês 1. Queries de referência:

## Taxa de conversão

```sql
SELECT
  date_trunc('day', created_at) AS day,
  count(DISTINCT buyer_id) AS buyers,
  count(*) AS orders
FROM tcg_judge.shop_orders
WHERE status IN ('paid', 'shipped', 'delivered')
GROUP BY day
ORDER BY day DESC;
```

## Abandono de checkout

Pedidos `pending` com PIX expirado vs. pagos.

## NPS via avaliações

```sql
SELECT
  avg(rating) AS avg_rating,
  count(*) FILTER (WHERE rating >= 4) AS promoters,
  count(*) FILTER (WHERE rating <= 2) AS detractors
FROM tcg_judge.shop_reviews
WHERE is_visible = TRUE;
```

## Receita Pro

Assinaturas ativas em `store_subscriptions` / Stripe.

## PIX vs Cartão

```sql
SELECT payment_method, count(*)
FROM tcg_judge.shop_orders
WHERE status NOT IN ('pending', 'cancelled')
GROUP BY payment_method;
```

## Alertas (Slack)

Configure `SLACK_ALERT_WEBHOOK_URL` e use `app.ops.alerts.check_critical_metrics()`.

Metas:

| Métrica | Alerta |
|---------|--------|
| Conversão | < 2% |
| P95 latência | > 500ms |
| Error rate | > 1% |

## Roadmap 3 meses

Ver `GO_LIVE.md` e `CHANGELOG.md`.
