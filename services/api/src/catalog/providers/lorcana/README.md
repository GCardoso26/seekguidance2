# Lorcana Catalog Provider (Release 1)

Beachhead do MVP 1.0 — ADR-012.

## Seed operacional (P0)

```bash
DATABASE_URL=... REDIS_URL=... npm run sync:lorcana:seed
DATABASE_URL=... npm run sync:lorcana:seed -- TFC
```

Depois: `worker:outbox` + `worker:search` para projetar.  
Smoke: `GET /api/v1/search?q=Rapunzel`

Factory: `LORCANA:lorcana-dataset` · sem scrape · sem cron · sem preço.
