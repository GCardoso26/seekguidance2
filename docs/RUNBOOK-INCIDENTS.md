# Judge TCG — Runbook de Incidentes

## Severidade

| Nível | Descrição | Exemplo | Resposta |
|-------|-----------|---------|----------|
| P0 | Site fora do ar | 500 em todas as páginas | PagerDuty + all-hands |
| P1 | Checkout quebrado | Erro 500 em `/api/checkout` | Slack #alerts-critical |
| P2 | Performance degradada | LCP > 5s por > 10 min | Slack #alerts-performance |
| P3 | Feature minor quebrada | Toast não aparece | GitHub issue |

## Playbooks

### P0: Site fora do ar

1. Verificar status: `curl https://judgetcg.com.br/api/health`
2. Check Vercel: Dashboard → Deployments → último deploy OK?
3. Check Supabase: Dashboard → Database → connections OK?
4. Check API Render: `curl https://seekguidance.onrender.com/v1/health`
5. Rollback: Vercel → último deploy estável → Promote to Production
6. Comunicar: Slack #incidents + redes sociais (se > 15 min)

### P1: Checkout falhando

1. Verificar logs: Sentry → filtros `checkout`, `payment`, `order`
2. Check Stripe: Dashboard → payments → falhas?
3. Check Supabase: `store_products` com stock negativo?
4. Check atomic checkout: `checkout_sessions` com status stuck?
5. Mitigar: desabilitar checkout temporário (feature flag)
6. Fix: aplicar correção e monitorar

### P2: Performance degradada

1. Verificar métricas: Vercel Analytics → Core Web Vitals
2. Check API Render: latência > 2s?
3. Check Redis Upstash: cache hit rate e rate limit analytics
4. Mitigar: aumentar TTL do cache de busca, reduzir limit de search
5. Escalar: Upstash Redis → plano maior

### P3: Rate limit excessivo em busca

1. Verificar `X-RateLimit-Remaining` nas respostas 429
2. Confirmar `UPSTASH_REDIS_REST_URL` no Vercel (rate limit distribuído)
3. Rodar smoke k6: `npm run load-test` em `frontend/runtime_console_v3`
4. Ajustar limites em `src/lib/rate-limit-redis.ts`

## Links úteis

- Vercel: https://vercel.com/dashboard
- Supabase (TCG-SaaS): https://supabase.com/dashboard/project/rjgzaakhzuzdzcooywva
- API Render: https://seekguidance.onrender.com/v1/health
- Produção: https://judgetcg.com.br/api/health

## Monitoramento externo (configurar manualmente)

| Monitor | URL | Intervalo |
|---------|-----|-----------|
| Home | https://judgetcg.com.br | 5 min |
| API Health | https://judgetcg.com.br/api/health | 1 min |
| Search | https://judgetcg.com.br/api/catalog/cards/search?game=mtg&limit=1 | 5 min |

## Sentry — alertas recomendados

1. **P0**: `level:error` + tags checkout/payment → Slack #alerts-critical
2. **Performance**: `transaction.duration:>4000` → Slack #alerts-performance
3. **Novos issues**: `is_new:true` → Slack #alerts
4. **Spike**: `count()>50` em 5 min → email
5. **Checkout**: message contém checkout/payment error → Slack crítico

Importar dashboard de referência: `frontend/runtime_console_v3/sentry.dashboard.json`
