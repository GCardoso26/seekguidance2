# Production Verification — RC1

**Data:** 2026-07-14  
**BASE:** `https://judgetcg.com.br`  
**Deploy:** `dpl_85fQfyC21x1kipBK1nC14P18EG1D`

## Rotas críticas HTTP

| Rota | HTTP | Notas |
|---|---:|---|
| `/` | **200** | WebP refs no HTML |
| `/loja` | **200** | WebP logos ativos |
| `/checkout` | **200** | |
| `/marketplace/cart` | **200** | redirect/alias cart |
| `/comprador` | **200** | |
| `/vendedor/painel` | **200** | guest may land auth |
| `/decks` | **200** | |

## Assets / arquitetura Store

| Check | Status |
|---|---|
| WebP ` /logos/mtg.webp` | **200** |
| Store RSC / WebP no hub | Evidência HTML `/loja` contém `.webp` |
| Health BFF | **200** |
| Catalog health | **200** |

## Smoke

```
RESULTADO: 34 passaram, 0 falharam
```

`scripts/smoke_test.py` com `SMOKE_BASE_URL=https://judgetcg.com.br`.

## Console / hydration

- Lab RC1.2: `errors-in-console` limpo.  
- Smoke + HTTP 200 nas críticas.  
- Inspeção LH production: A11y/BP **100** nas rotas medidas (ver `PRODUCTION_LIGHTHOUSE.md`).
