# PDV — Persona Renato (Performance)

**Persona:** Renato Oliveira — Performance Auditor  
**Fonte:** `persona-renato-performance-latest.json` (2026-07-22T21:14:31Z)

## Veredito Renato

Carga **leve** apenas (`lightLoadOnly: true`, `scale: 0.05`).  
Dashboard / Produtos / Pedidos / PDV / Marketplace / Relatórios (métricas de memória, FPS, CWV): **Não comprovado**.

## Workloads executados

| Workload | Resultado | Evidência |
| --- | --- | --- |
| search (5) | 5/5 OK, avg ~233 ms, p95 245 ms | JSON persona |
| filters (10) | 10/10 OK, avg ~260 ms, p95 311 ms | JSON persona |
| pdp (25) | **0/25 OK — todos HTTP 404** | JSON persona (`PDV-BUG-002`) |
| Carga média | **Não comprovado** | — |

## Checklist do brief

| Abrir | Status |
| --- | --- |
| Dashboard | **Não comprovado** (perf) |
| Produtos | **Não comprovado** (perf) |
| Pedidos | **Não comprovado** (perf) |
| PDV | **Não comprovado** (perf); Playwright funcional falhou parcialmente |
| Marketplace | **Não comprovado** (perf) |
| Relatórios | **Não comprovado** (perf) |
| Tempo / memória / FPS / Core Web Vitals | **Não comprovado** |

## Bugs

- **P2 `PDV-BUG-002`:** PDP workload 25×404 — impacto em métrica de performance e cobertura de página de produto.

## Melhorias sugeridas (Renato)

1. Corrigir URLs/seed do workload PDP antes da próxima campanha.
2. Incluir Lighthouse/CWV em rotas autenticadas do painel e PDV.
3. Rodar escala média quando leve estiver verde.

## Conclusão

Search/filters leves ok. Performance do dia operacional do lojista (painel+PDV): **Não comprovado**. Status “pass” da persona refere-se ao job leve automatizado, não ao aceite PDV day.
