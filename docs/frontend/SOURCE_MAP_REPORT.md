# Source Map Report — RC1.2

**Data:** 2026-07-14

## Config

`next.config.mjs`:

```js
productionBrowserSourceMaps: true
```

## Lighthouse

| Audit | Score | Nota |
|---|---:|---|
| `valid-source-maps` | **1** | Maps first-party presentes |
| Sub-itens | warning | Alguns chunks: `missing items in .sourcesContent` / column out of bounds |

## Ambientes

| Ambiente | Source maps | Nota |
|---|---|---|
| Dev | Sim (Next default) | OK |
| Lab `npm run start` (prod build) | Sim (.map ao lado dos chunks) | OK p/ BP |
| Production CDN | Depende do deploy pós-RC1.2 | Revalidar após ship |

## Conclusão

Não bloqueia Best Practices. Dívida cosméticas nos maps de vendor/chunks grandes — aceitável.
