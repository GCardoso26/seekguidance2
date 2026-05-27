# Sorcery: Contested Realm — Rulebook (ingestão manual)

O site oficial redireciona downloads automáticos (HTML `/lander`). O rulebook deve ser colocado **manualmente** nesta pasta.

## Ficheiro

Coloque **um** destes nomes (o primeiro encontrado é usado):

| Ficheiro sugerido |
|-------------------|
| `Sorcery-Contested-Realm-Rulebook-October-2024.pdf` |
| `Sorcery-Contested-Realm-Rulebook.pdf` |
| `Sorcery-Rulebook.pdf` |
| `sorcery-rulebook.pdf` |

**Origem:** [sorcerytcg.com/how-to-play](https://sorcerytcg.com/how-to-play) → link **Rulebook** (ex.: December 2025 update).

## Ingestão

### Windows (PowerShell)

```powershell
cd S:\tcg-judge
pwsh scripts/test-db-connection.ps1   # confirme ligacao antes
pwsh scripts/ingest-sorcery-local.ps1
```

Ou com caminho explícito:

```powershell
python scripts/ingest_tcg.py --game sorcery --file "data\ingest\sorcery\Sorcery-Rulebook.pdf" --doc-type CR --title "Sorcery: Contested Realm Rulebook" --publisher "Erik's Curiosa"
```

### Linux / EC2

```bash
bash scripts/ec2/ingest-sorcery-local.sh
```
