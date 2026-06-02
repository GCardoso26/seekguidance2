# Degraded Mode Operations

## Componentes opcionais

| Componente | Fallback |
|------------|----------|
| Redis | Rate limit + cache em memória |
| Postgres | Judge mock + localStorage frontend |
| OTEL | Spans in-memory only |
| Reranker | Retrieval sem rerank |

## Flags

`runtime_resilience.events.degraded_status()` — redis, postgres, otel, reranker

## Eventos

Tabela `resilience_events`: `fallback_triggered`, `degraded_mode_active`

## Operação

Sistema continua respondendo em modo degradado; health score reduz em `/runtime/infrastructure`.
