# ROUTING VALIDATION — V6.4

## Bug

`/marketplace?game_id=&category=` → redirect Next `/loja?from=marketplace` (query perdida).

## Correção canônica

```
/marketplace/produtos?game_id={GAME}&category={id}
```

## Função

`marketplaceCategoryHref` agora gera o path acima.

## Call sites alinhados

- `GameHubPanel` / `GameMegaMenuPanel` (“Ver todas…”)
- `CardRelatedProductsSection` (Sleeves, Deck boxes, …)
- `OfficialRelatedProducts`, `CardVersionsTab`

## Não deve abrir

- `/games`, `/game`, portal inicial sem filtro, `/loja?from=marketplace` ao clicar categoria de acessório.
