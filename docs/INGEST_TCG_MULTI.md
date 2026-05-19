# Ingestão multi-TCG (Pokémon, Lorcana, Yu-Gi-Oh!, One Piece)

Pipeline igual ao MTG: PDF oficial → parse → chunk → RDS → embeddings OpenAI.

## Catálogo

`services/ingestion/tcg_judge_ingestion/crawler/tcg_official_sources.py`

| Jogo | `games.slug` | Documentos |
|------|----------------|------------|
| Pokémon | `pokemon` | CR, FORMAT_STANDARD, FORMAT_EXPANDED, MTR |
| Lorcana | `lorcana` | CR, MTR |
| Yu-Gi-Oh! | `yugioh` | CR, MTR |
| One Piece | `onepiece` | CR, MTR, IPG (floor rules) |

## CLI

```bash
export DATABASE_URL="postgresql+asyncpg://..."
export OPENAI_API_KEY="sk-..."

pip install -e services/ingestion

# Todos os PDFs do catálogo
python scripts/ingest_tcg.py --game pokemon --all
python scripts/ingest_tcg.py --game lorcana --all
python scripts/ingest_tcg.py --game yugioh --all
python scripts/ingest_tcg.py --game onepiece --all

# Só core rules
python scripts/ingest_tcg.py --game pokemon --only CR

# MTG (hub Wizards)
python scripts/ingest_tcg.py --game mtg --mtg-discover --mtg-only CR
```

## EC2

Ver `scripts/ec2/ingest-tcg-batch.sh`.

## Frontend

`/judge` — dropdown de TCG; jogos acima activos após ingestão com embeddings.

## Atualizar URLs

Quando a publisher publicar nova edição, editar `tcg_official_sources.py` e re-correr `--all` para o jogo.
