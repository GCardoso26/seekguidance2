# RC1 Smoke Report

**Data:** 2026-07-13T20:07:30Z  
**Comando:** `SMOKE_FAIL_FAST=0 python scripts/smoke_test.py`  
**Resultado:** **34 passaram, 0 falharam** (exit 0)

## Escopo coberto

| Área | Resultado |
|---|---|
| API / Catalog health + image coverage 100% | OK |
| BFF `/api/health` | OK |
| Homepage / landing marketplace | OK |
| Perfil (coleção, seguidos) | OK |
| Loja / busca / game hub MTG | OK |
| BFF games + catalog search | OK |
| Auth gates (gamification, analytics 401) | OK |
| Leaderboard / decks / checkout | OK |
| Seller painel + redirects `/store/*` | OK |
| Painel listagens/vendas/estatísticas/config | OK |

## Ajustes do harness (não produto)

- Aceitar título SSR `Loja de cartas TCG`
- Redirect `/store/orders` → `/vendedor/painel/pedidos` (espelha `next.config`)
- `expire-stale` espera **401** sem secret (smoke público)
- stdout UTF-8 + setas ASCII (Windows cp1252)

## Evidência

Saída completa: `context/_smoke_raw.txt` (local) — resumida neste relatório.
