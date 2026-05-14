# Plano MVP (8–12 semanas)

## Objetivo do MVP

Entregar **um fluxo completo** para **1 TCG (Magic)** com ingestão mínima (CR ou subset), busca vetorial funcional, respostas com **citações reais** e app mobile em **TestFlight / Play Internal**.

## Escopo MVP

1. **Mobile**: login guest + seleção MTG + chat + histórico local.
2. **Backend**: `/v1/chat/ask` com RAG real (pgvector) para corpus MTG seed.
3. **Ingestão**: 1 crawler Playwright → 1 documento piloto + pipeline de chunk/embed.
4. **Admin (web mínimo)**: aprovar ingestão, ver logs, toggle feature flags LLM.
5. **Observabilidade**: logs estruturados + métricas básicas (Prometheus).

## Fora do MVP

OCR de cartas, áudio juiz, engine de torneio completo, offline total — **fase 2+**.

## Critérios de aceite

- Toda resposta inclui **≥1 citação** com URL oficial.
- Disclaimer visível no app.
- P95 latência RAG < 4s (região alvo) com top-k ≤ 20 após rerank.
