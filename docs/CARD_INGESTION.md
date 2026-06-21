# Fase 0 — Ingestão de Cartas

O Judge TCG já possui **`card_catalog`** (PostgreSQL/Supabase) e adapters de sync para torneios. A Fase 0 estende isso para suportar marketplace tipo Cardtrader/Liga/MyPCards.

## O que já existia

| Componente | Caminho |
|------------|---------|
| Schema `card_catalog` | `supabase/migrations/20260605100000_multi_tcg_tournament.sql` |
| Sync Scryfall (MTG) | `services/api/app/tcg_adapters/sync_mtg.py` |
| Sync Pokémon (TCGdex) | `services/api/app/tcg_adapters/sync_pokemon.py` |
| Sync Lorcana | `services/api/app/tcg_adapters/sync_lorcana.py` |
| Busca torneio | `GET /runtime/judge/tournament/games/{code}/cards/search` |

## O que foi adicionado (Fase 0)

| Componente | Caminho |
|------------|---------|
| Migration Phase 0 | `supabase/migrations/20260621140000_card_catalog_phase0.sql` |
| Pipeline orquestrador | `services/api/app/catalog/pipeline.py` |
| Health check ingestão | `services/api/app/catalog/health.py` |
| Meilisearch indexer | `services/api/app/catalog/search_index.py` |
| Sync Yu-Gi-Oh! | `services/api/app/tcg_adapters/sync_yugioh.py` |
| API catálogo | `GET /runtime/judge/catalog/health`, `/catalog/cards/search`, `POST /catalog/sync/{game}` |
| Types frontend | `frontend/runtime_console_v3/src/types/card.ts` |

## Pré-requisito vs Marketplace v1.0

O **Marketplace Neutro v1.0** (lojas, PIX, cupons) usa `store_products` — produtos cadastrados manualmente pelo lojista. **Não depende** do catálogo global de cartas.

A **Fase 1+** (deckbuilder, smart cart, busca facetada Cardtrader-style) **depende** da Fase 0 concluída.

## Comandos

```powershell
# Migration
cd S:\tcg-judge
supabase db push --include-all

# Sync local (MTG amostra 500 cartas)
cd services\api
python -m app.jobs.card_sync

# Sync jogo específico via API (autenticado)
curl -X POST "https://seekguidance.onrender.com/runtime/judge/catalog/sync/MTG?full=false" `
  -H "X-Judge-User-Id: SEU-UUID"

# Health
curl https://seekguidance.onrender.com/runtime/judge/catalog/health
```

## Meilisearch (opcional)

```yaml
# docker-compose.yml — serviço meilisearch
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=dev-master-key
```

Busca usa Meilisearch quando `MEILI_HOST` está configurado; caso contrário, fallback PostgreSQL ILIKE.

## Critérios para iniciar Fase 1 (marketplace avançado)

- [ ] `total_cards` > 10.000 (MTG completo via Scryfall bulk)
- [ ] Pokémon + Lorcana + YGO com sync regular
- [ ] Imagens disponíveis (>95% com `image_url` ou `image_uris`)
- [ ] Busca < 200ms (Meilisearch em produção)
- [ ] `ready_for_marketplace: true` em `/catalog/health`

## Roadmap adapters

| TCG | Status | Fonte |
|-----|--------|-------|
| Magic | ✅ Bulk Scryfall | sync_mtg.py |
| Pokémon | ✅ TCGdex | sync_pokemon.py |
| Lorcana | ✅ Lorcanajson | sync_lorcana.py |
| Yu-Gi-Oh! | ✅ YGOPRODeck | sync_yugioh.py |
| One Piece | ⬜ | API fan |
| FAB | ⬜ | fabdb |
| Digimon | ⬜ | API fan |

## Nota sobre Prisma

Este repo usa **Supabase migrations + SQLAlchemy**, não Prisma. O schema unificado está em SQL + tipos TypeScript/Python equivalentes ao spec `UnifiedCard`.
