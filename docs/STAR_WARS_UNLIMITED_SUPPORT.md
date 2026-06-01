# Star Wars: Unlimited (SWU)

## Registry

- `game_slug`: `swu`
- `tcg_id` (UI): `star_wars_unlimited`
- Badge **BETA** no seletor (`TCG_BETA`)

## Ingestão

Fonte HTML oficial em `tcg_official_sources.py`:

`https://starwarsunlimited.com/rules`

```bash
python scripts/ingest_tcg.py --game swu --all
```

## Confiança

Perfil dedicado em `confidence_profiles.py` (`swu`).

## Pipeline

Chunking, embeddings, reranking e retrieval usam o mesmo pipeline multi-TCG existente.
