# Roadmap

## Fase 0 — Fundação (concluída neste repo)

Monorepo, Docker, schema DB, API stub, app Expo com telas mock, CI.

## Fase 1 — RAG real + MTG

Ingestão piloto, embeddings, índice vetorial, rerank, modos player/judge.

## Fase 2 — Multi-TCG

Habilitar Pokémon, Yu-Gi-Oh!, Lorcana com crawlers dedicados e metadados regionais.

## Fase 3 — Monetização

Stripe / Play Billing / StoreKit — tiers Free, Premium, Judge Pro.

## Fase 4 — Offline

SQLite no mobile + sync de chunks por jogo; fila de perguntas offline.

## Fase 5 — Torneios

Pairings, timer, políticas por formato — integração opcional com APIs externas.

**Estado (2026-06):** Fases 1–5 ~85% no backend; frontend Sprint 1 concluído (6 rotas); suite `tests/platform/` consolidada.

## Runtime Console — entregas recentes (2026-06)

| Épico | Status | Notas |
|-------|--------|-------|
| Painel lojista (10 rotas) | ✅ | Bundle médio ~424 KB |
| PDV v1.1 (PIX automático) | ✅ | 436 KB First Load JS |
| **Marketplace filtros comprador** | ✅ | PR #20 + #21 mergeadas; 495 KB (meta ≤ 500 KB ADR-001) |
| **Torneios painel lojista** | 🚀 | `/vendedor/painel/torneios` — MVP entregue |
| Catálogo — filtro por coleção MTG/apitcg | ✅ | PR #20 — case-insensitive + sync sets |
| Wishlist | ⏳ | Próximo quick win |

## Fase 6 — Decisão de produto (2026-06-06)

| Opção | Prioridade | Justificativa |
|-------|------------|---------------|
| **Painel Juiz Digital** | ✅ Sprint 3 | Schema `infractions`, API `judge_assistant`, componentes `judge-panel/` já existem; complementa Judge RAG |
| Mobile Expo | Sprint 4 | `apps/mobile/` extenso, app único ainda não em produção |
| POS loja | Sprint 5 | Zero implementação |

Infraestrutura existente para Juiz Digital:

- Migrations: `20260604162000_infractions.sql`, `judge_assistant_foundation`
- API: `/runtime/judge/infractions`, `/runtime/judge/rulings/*`, `/runtime/judge/deck-validator/*`
- Frontend: `src/components/judge-panel/`, `/judge/dashboard`

## Fase 6 (legado) — Multimodal

OCR, board state, voz, streaming — backlog pós-Juiz Digital.
