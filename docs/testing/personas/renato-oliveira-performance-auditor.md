# Renato Oliveira — Performance Auditor

**Cargo:** Performance Auditor (carga leve)  
**Pergunta:** A plataforma aguenta uso real sem degradar?  
**Não é:** stress test, DDoS, soak 24h.

## Perfis (quando stack no ar)

| Operação | Amostra alvo |
| --- | --- |
| Search | 100 (configurável `PERF_SEARCH_N`) |
| PDP | 500 (amostra reduzida se local) |
| Filtros | 200 |
| Carrinho | 100 |

Métricas: média · P95 · P99 · CPU/RAM/Redis/OpenSearch (observação manual ou staging)

## Automação mínima

- Golden path budgets: `performanceBudget.test.ts`
- HTTP sample: `renato-performance-audit.mjs` (só se audit PASS)

## Relatório

Perf Score · budgets · violações · infra notes
