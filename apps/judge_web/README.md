# Judge Web (MVP)

Página estática `index.html` para smoke de `/v1/chat/ask` com citações e `reasoning_v3`…`reasoning_v11`.

## Uso

1. Subir API (`docker compose up` na raiz do monorepo ou `uvicorn` local).
2. Servir esta pasta com qualquer servidor estático, por exemplo:  
   `python -m http.server 3000`
3. Opcional: `localStorage.setItem("TCG_JUDGE_API", "https://…")` antes de perguntar.

## Próximo

Design system, visualização de stack/cadeia, timeline e modo treino (ver `judge_training`).
