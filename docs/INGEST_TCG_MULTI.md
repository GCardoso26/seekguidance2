# Ingestão multi-TCG (Pokémon, Lorcana, Yu-Gi-Oh!, One Piece)

Pipeline igual ao MTG: PDF oficial → parse → chunk → RDS → embeddings OpenAI.

## Catálogo

`services/ingestion/tcg_judge_ingestion/crawler/tcg_official_sources.py`

| Jogo | `games.slug` | Documentos |
|------|----------------|------------|
| Pokémon | `pokemon` | CR (rulebook), MTR (tournament handbook; PDF local na EC2) |
| Lorcana | `lorcana` | CR, MTR (PDF em files.disneylorcana.com) |
| Yu-Gi-Oh! | `yugioh` | CR (PDF EU mirror), MTR |
| One Piece | `onepiece` | CR, MTR, IPG (floor rules) |
| Flesh and Blood | `fab` | CR (CloudFront + fallback rules.fabtcg.com) |
| Digimon | `digimon` | CR (manual), CR_ADV (comprehensive), MTR |
| Gundam | `gundam` | CR, MTR |
| DB Fusion World | `dbfw` | CR (`--game dragon_ball` aceita alias) |
| Sorcery | `sorcery` | CR (**PDF local** em `data/ingest/sorcery/` — ver README) |
| Vanguard | `vanguard` | CR |
| Riftbound | `riftbound` | CR (mirror comunitário; ver rules-hub Riot) |
| Union Arena | `union_arena` | CR, MTR |

## CLI (Windows local)

O script carrega automaticamente `services/api/.env` ou `.env.production` na raiz do repo.

```powershell
cd S:\tcg-judge
$env:PYTHONPATH = "S:\tcg-judge\services\ingestion"

# Opção A — carregar de services\api\.env (se já tiver DATABASE_URL + OPENAI_API_KEY)
. .\scripts\load-ingest-env.ps1
python scripts/ingest_tcg.py --game fab --all

# Opção B — definir manualmente (Supabase Session pooler + asyncpg)
$env:DATABASE_URL = "postgresql+asyncpg://postgres.PROJECT_REF:SENHA@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
$env:OPENAI_API_KEY = "sk-..."
python scripts/ingest_tcg.py --game digimon --all
```

**Onde obter `DATABASE_URL`:** Supabase → **Settings → Database → Connection string**:

| Modo | User | Host | Ingestão |
|------|------|------|----------|
| **Direct connection** | `postgres` | `db.PROJECT_REF.supabase.co` | Recomendado (scripts longos) |
| **Session pooler** | `postgres.PROJECT_REF` | `aws-X-REGION.pooler.supabase.com:5432` | Copiar região exacta do Dashboard |

Trocar `postgresql://` por `postgresql+asyncpg://`. Senha com `#` → `%23`.

Teste antes de ingerir: `pwsh scripts/test-db-connection.ps1`

Erro `tenant/user postgres.XXXX not found` → região do pooler errada (`aws-0` vs `aws-1`) ou use **Direct connection**.

**Sem ficheiro `.env`:** copie `.env.supabase.example` → `.env.production` e preencha.

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
python scripts/ingest_tcg.py --game fab --all
python scripts/ingest_tcg.py --game digimon --all
python scripts/ingest_tcg.py --game gundam --all
python scripts/ingest_tcg.py --game dbfw --all
# Sorcery: colocar PDF em data/ingest/sorcery/ primeiro (ver data/ingest/sorcery/README.md)
pwsh scripts/ingest-sorcery-local.ps1
# ou: python scripts/ingest_tcg.py --game sorcery --all
python scripts/ingest_tcg.py --game vanguard --all
python scripts/ingest_tcg.py --game riftbound --all
python scripts/ingest_tcg.py --game union_arena --all

# Validar URLs do catálogo (sem DB/OpenAI)
pwsh scripts/e2e/validate-ingestion-catalog.ps1

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
- **Pokémon MTR:** handbook em `data/ingest/pokemon/play-pokemon-tcg-tournament-handbook-en.pdf` (ver README). Deck lists não entram no catálogo.
- **Sorcery CR:** rulebook em `data/ingest/sorcery/` — download automático bloqueado; use `scripts/ingest-sorcery-local.ps1` ou `bash scripts/ec2/ingest-sorcery-local.sh`.
- **Yu-Gi-Oh! CR:** mirror EU `img.yugioh-card.com/eu/wp-content/uploads/...` (NA `/ygo_cms/` costuma 404).
- **Lorcana MTR:** `Disney Lorcana TCG Tournament Rules S2_09-Sep-25.pdf` (página resources em disneylorcana.com).
- Downloads validam cabeçalho `%PDF-` antes do parse.
