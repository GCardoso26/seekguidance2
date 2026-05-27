# Judge Frontend UI — Consulta de regras TCG

Área do usuário final em `/judge` no Runtime Console v3.

## Fluxo

1. Aceder `http://<host>:3000/judge`
2. Selecionar TCG (Magic, Pokémon, Lorcana, Yu-Gi-Oh!, One Piece e mais)
3. Digitar pergunta → **Perguntar** ou Enter
4. `POST /runtime/judge/query` via proxy `/api/proxy`
5. Resposta com texto, confiança e fontes

## API

### `POST /runtime/judge/query`

```json
{ "tcg": "magic", "question": "Como funciona trample?" }
```

```json
{
  "success": true,
  "answer": "...",
  "confidence": 0.85,
  "sources": [{ "title": "...", "url": "...", "section": "702.19a" }],
  "runtime_confidence": 0.94,
  "integrity_status": "ok"
}
```

- TCGs com corpus indexado → RAG real (`game_slug` em Postgres: `mtg`, `pokemon`, `fab`, `digimon`, etc.)
- **swu** (Star Wars: Unlimited) → `success: false` com mensagem "em breve"
- Fallback local se RAG falhar e pergunta contiver "trample"

### Health badge

`GET /health` → Online | Degraded | Offline

## Componentes

`frontend/runtime_console_v3/src/components/judge/`

- `TcgSelector`, `QuestionInput`, `AskButton`, `ResponseCard`
- `JudgeHistory`, `JudgeLayout`, `LoadingPanel`, `ErrorPanel`

## Persistência

Últimas **10** perguntas em `localStorage` (`judge-history-v1`).

## Deploy EC2

```bash
cd ~/seekguidance2
git pull
bash scripts/ec2/start-api.sh          # inclui rota /runtime/judge/query
bash scripts/ec2/start-console.sh
```

Abrir: `http://<IP>:3000/judge`

## Testes

```bash
# Backend
cd services/api && python -m pytest tests/runtime_judge -q

# Frontend
cd frontend/runtime_console_v3 && npm run test && npm run lint
```
