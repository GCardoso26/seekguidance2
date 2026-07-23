# MARKETPLACE VALIDATION — V6.4

## API (produção)

| Query | Resultado |
|-------|-----------|
| `GET /api/marketplace/products?limit=5` | 200, `total≈13571`, category `single` |
| `?category=sleeve` | 1 produto (`tcg_id="Standard size"`) |
| `?category=sleeve&game_id=MTG` | 0 |
| `?category=playmat` / `deck_box` | 0 |

## UI

- Listagem `/marketplace/produtos` deve renderizar grid ou empty state (E2E).
- Filtros desktop: labels/inputs com `text-foreground`.
- Empty de acessórios com `game_id` é **inventário**, não falha de proxy.

## Critério V6.4-005

- **Singles / marketplace geral:** PASS (produtos retornam).
- **Sleeves/Playmats/… por jogo:** FAIL de inventário (sem alteração de DB neste ciclo).
- **Routing para listagem de categoria:** PASS (código).
