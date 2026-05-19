# Ingestão multi-TCG (Pokémon, Lorcana, Yu-Gi-Oh!, One Piece)

Pipeline igual ao MTG: PDF oficial → parse → chunk → RDS → embeddings OpenAI.

## Catálogo

`services/ingestion/tcg_judge_ingestion/crawler/tcg_official_sources.py`

| Jogo | `games.slug` | Documentos |
|------|----------------|------------|
| Pokémon | `pokemon` | CR, FORMAT_STANDARD, FORMAT_EXPANDED, MTR, FORMAT_NOTES (HTML) |
| Lorcana | `lorcana` | CR, MTR (PDF em files.disneylorcana.com) |
| Yu-Gi-Oh! | `yugioh` | CR (PDF EU mirror), MTR |
| One Piece | `onepiece` | CR, MTR, IPG (floor rules) |

## CLI (Ubuntu / EC2 — use venv, não `pip` no sistema)

```bash
cd ~/seekguidance2
bash scripts/ec2/setup-ingest-venv.sh
source .venv-ingest/bin/activate

export DATABASE_URL="postgresql+asyncpg://..."   # ou: source .env.production
export OPENAI_API_KEY="sk-..."

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

```bash
cd ~/seekguidance2
git pull
bash scripts/ec2/load_secrets.sh
bash scripts/ec2/setup-ingest-venv.sh    # uma vez
bash scripts/ec2/ingest-tcg-batch.sh
```

Se aparecer `externally-managed-environment`, **não** use `sudo pip`; use o venv acima.

**Python 3.14 no Ubuntu não serve** para ingestão local (lxml/tiktoken sem wheels). Use **3.12**:

```bash
sudo apt-get update
sudo apt-get install -y python3.12 python3.12-venv
rm -rf .venv-ingest
bash scripts/ec2/setup-ingest-venv.sh
```

**Alternativa (recomendada se 3.12 der trabalho):** ingestão no Docker worker (Python 3.12):

```bash
bash scripts/ec2/ingest-via-docker.sh
# ou um jogo: bash scripts/ec2/ingest-via-docker.sh pokemon
```

Os scripts definem `PYTHONPATH=/repo/services/ingestion` para usar o código do `git pull`, não só o pacote instalado na imagem. Se mudar código de ingestão, faça `git pull` e volte a correr o script (rebuild automático no `ingest-pokemon-local.sh`).

## Frontend

`/judge` — dropdown de TCG; jogos acima activos após ingestão com embeddings.

## Atualizar URLs

Quando a publisher publicar nova edição, editar `tcg_official_sources.py` e re-correr `--all` para o jogo.

Notas:

- **Pokémon CR:** CDN `assets.pokemon.com` (evita Incapsula em `pokemon.com`); fallbacks no catálogo.
- **Pokémon formatos/MTR:** Incapsula bloqueia EC2. Coloque PDFs em `data/ingest/pokemon/` (ver README) e re-corra `ingest-via-docker.sh pokemon` ou `bash scripts/ec2/ingest-pokemon-local.sh`. CLI: `--file path.pdf --doc-type FORMAT_STANDARD`.
- **Yu-Gi-Oh! CR:** mirror EU `img.yugioh-card.com/eu/wp-content/uploads/...` (NA `/ygo_cms/` costuma 404).
- **Lorcana MTR:** `Disney Lorcana TCG Tournament Rules S2_09-Sep-25.pdf` (página resources em disneylorcana.com).
- Downloads validam cabeçalho `%PDF-` antes do parse.
