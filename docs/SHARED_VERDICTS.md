# Vereditos partilhados

## Criar partilha

`POST /runtime/judge/share` com `tcg`, `question` e `response` (JSON completo).

Resposta inclui `id` e `signature` (HMAC) quando `JUDGE_SHARE_SECRET` está definido.

## Abrir partilha

URL: `/judge?share=<UUID>&sig=<HMAC>`

`GET /runtime/judge/share/{id}?sig=...` valida a assinatura e devolve apenas vereditos `is_public=true`.

## Open Graph

Imagem dinâmica: `/api/og/verdict?id=<UUID>&sig=...`

## Segurança

- Sessões privadas não são expostas via `share`
- Sem segredo HMAC, links funcionam sem `sig` (modo desenvolvimento)
