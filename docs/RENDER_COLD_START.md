# Cold start no Render — mitigação

O Judge TCG pré-aquece embedding, cache e registry no **lifespan** da API (`WARMUP_ENABLED=true` por defeito). Mesmo assim, no **Render Free** o container hiberna após ~15 min sem tráfego.

## Opções (configuração, sem código)

1. **Keep-alive externo** (paliativo, custo zero)
   - UptimeRobot ou cron-job.org a fazer GET em `https://<api>/runtime/judge/health` a cada **4 minutos**
   - Evita hibernação no Free tier

2. **Render Starter** (~7 USD/mês)
   - Always-on; recomendado em produção com HyDE + reranker local

3. **Fly.io**
   - Cold start Python tipicamente 2–3 s; reutilizar o mesmo Dockerfile

4. **AWS EKS** (longo prazo)
   - Ver `infra/` e HPA por métricas Judge (`judge_requests_total`)

## Variáveis de ambiente

| Variável | Default | Descrição |
|----------|---------|-----------|
| `WARMUP_ENABLED` | `true` | Desliga warmup no startup |
| `WARMUP_EMBEDDING` | `true` | Pré-chama embedding OpenAI |
| `WARMUP_RERANKER` | `true` | Health check do reranker se `RERANKER_ENABLED` |
| `WARMUP_TIMEOUT_SECONDS` | `30` | Timeout do warmup (não bloqueia o servidor) |

## Monitorização

- `GET /runtime/judge/warmup` — métricas de startup
- `GET /runtime/judge/health` — campo `warmup.components_ready`
- `GET /runtime/judge/health-score` — score 0–100 para o dashboard Infrastructure

Ver também: [WAVE2C_WARMUP.md](./WAVE2C_WARMUP.md)
