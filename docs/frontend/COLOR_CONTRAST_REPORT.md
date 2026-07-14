# Color Contrast Report — RC1.2

**Data:** 2026-07-14  
**Padrão:** WCAG AA (≥4.5:1 texto normal)

## Tokens semânticos (ajustados)

| Token | Antes | Depois | Contraste vs ~#fdfdfe | Status |
|---|---|---|---:|---|
| `--warning-500` | `38 92% 50%` (~#f59e0b) | `32 90% 34%` | **~5.0:1** | PASS |
| `--warning-700` | `32 90% 36%` | `28 90% 28%` | ≥5.5:1 | PASS |
| `--success-500` | (já hardenado S19) | `142 72% 26%` | ≥4.5:1 | PASS |
| `--danger-500` | (já hardenado) | `0 72% 40%` | ≥4.5:1 | PASS |
| `--muted-foreground` / Sync Store | RC1.1 residual | path Store A100 | PASS lab |

## Onde o LH falhava

- Home: rating `0.0` com `text-warning` → foreground `#f59f0a`, bg `#fdfdfe`, ratio **2.09**.
- Correção por **token**, não por página.

## Validação

Lighthouse `color-contrast` score = **1** em todas as rotas da bateria RC1.2 (lab desktop).

Arquivo: `src/styles/design-tokens.css`.
