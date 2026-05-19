# Play! Pokémon — Tournament Handbook (ingestão manual)

A Incapsula bloqueia o download automático do handbook em `pokemon.com` na EC2.

Coloque **apenas** este ficheiro nesta pasta:

| Ficheiro | Documento |
|----------|-----------|
| `play-pokemon-tcg-tournament-handbook-en.pdf` | Tournament Handbook (MTR) |

Origem: [play.pokemon.com — Documents](https://play.pokemon.com/en-us/resources/documents/)

O **rulebook (CR)** ingere via CDN `assets.pokemon.com` sem ficheiro local.  
Deck lists (Standard/Expanded) **não** fazem parte do catálogo de ruling base.

## Na EC2

```bash
cd ~/seekguidance2
bash scripts/ec2/ingest-pokemon-local.sh
```

Ou:

```bash
docker compose -f docker-compose.production.yml --env-file .env.production run --rm \
  -v "$(pwd):/repo" -w /repo \
  -e PYTHONPATH=/repo/services/ingestion \
  worker \
  python scripts/ingest_tcg.py --game pokemon --all
```
