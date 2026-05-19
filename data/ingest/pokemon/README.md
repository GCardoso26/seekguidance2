# PDFs Play! Pokémon (ingestão manual)

A Incapsula bloqueia downloads automáticos de `pokemon.com` a partir da EC2.  
Baixe estes PDFs no browser (logado ou não) e coloque-os **nesta pasta** com os nomes exactos:

| Ficheiro | Documento |
|----------|-----------|
| `play-pokemon-deck-list-a4-tef.pdf` | Standard — regulation & deck list |
| `play-pokemon-deck-list-85x11-tef.pdf` | Expanded — regulation & deck list |
| `play-pokemon-tcg-tournament-handbook-en.pdf` | Tournament handbook (MTR) |

Origem: [play.pokemon.com — Documents](https://play.pokemon.com/en-us/resources/documents/)

## Na EC2

```bash
# No seu PC (exemplo scp)
scp play-pokemon-deck-list-a4-tef.pdf ubuntu@<EC2>:~/seekguidance2/data/ingest/pokemon/
scp play-pokemon-deck-list-85x11-tef.pdf ubuntu@<EC2>:~/seekguidance2/data/ingest/pokemon/
scp play-pokemon-tcg-tournament-handbook-en.pdf ubuntu@<EC2>:~/seekguidance2/data/ingest/pokemon/

# Na EC2 — re-ingestão (usa PDFs locais automaticamente)
cd ~/seekguidance2
bash scripts/ec2/ingest-via-docker.sh pokemon
```

Ou um ficheiro de cada vez:

```bash
bash scripts/ec2/ingest-via-docker.sh
# dentro do worker:
python scripts/ingest_tcg.py --game pokemon --file data/ingest/pokemon/play-pokemon-deck-list-a4-tef.pdf \
  --doc-type FORMAT_STANDARD --title "Play! Pokémon TCG Standard Format — Regulation & Deck List (TEf)"
```
