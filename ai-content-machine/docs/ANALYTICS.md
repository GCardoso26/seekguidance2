# Analytics Engine

## Canonical metrics

views, likes, comments, shares, saves, watchTime, averageViewDuration, completionRate, followersGained, clicks, conversions

## MetricNormalizer

Converte payloads YouTube / TikTok / Instagram / Pinterest → modelo canônico.

## metric_snapshots

Append-only. Nunca sobrescreve snapshot anterior. `raw_metrics` para auditoria. `snapshot_key` único.

## MockAnalyticsProvider

Cenários **determinísticos** (sem aleatoriedade pura):

- `WINNER` · `NORMAL` · `LOSER` · `INSUFFICIENT_DATA`

## API

`POST /api/analytics/sync` · `GET /api/analytics/workspaces/:id/snapshots`

## Eventos

`metrics.updated` · `metrics.snapshot_created`
