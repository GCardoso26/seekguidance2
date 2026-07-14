# Accessibility Audit — RC1.2

**Data:** 2026-07-14  
**Preset:** Lighthouse desktop + inspeção de falhas por audit  
**BASE:** `http://localhost:3000`

## Resultado agregado (pós-fix)

| Rota | A11y | color-contrast | errors relacionados |
|---|---:|---:|---|
| `/` | **100** | 1 | — |
| `/loja` | **100** | 1 | — |
| `/loja/mtg` | **100** | 1 | — |
| `/loja/busca` | **100** | 1 | — |
| `/marketplace/cart` → `/carrinho` | **100** | 1 | — |
| `/checkout` | **100** | 1 | — |
| `/comprador` | **100** | 1 | — |
| `/vendedor/painel` (guest → `/entrar`) | **100** | 1 | — |
| `/vendedor/painel/estoque` (guest → `/entrar`) | **100** | 1 | — |
| `/decks` | **100** | 1 | — |

**Meta RC:** A11y ≥98 → **PASS** em todas as rotas da bateria.

## Inventário pré-fix (RC1.1 → RC1.2)

| Severidade | Issue | Onde | Correção |
|---|---|---|---|
| Critical | `color-contrast` ratio **2.09** — texto `0.0` / rating com `#f59f0a` | Home (`FeaturedSellerCard` + `text-warning`) | Token `--warning-500` → HSL L~34% (~5.0:1) |
| High | `color-contrast` muted “Em sincronização” / cards Store | RC1.1 residual | Já mitigado no path Store (A100) |
| Medium | `target-size` Ctrl+K | Header (runs anteriores) | Já endereçado no hardening prévio |
| Low | `heading-order` / landmarks | rotas seller/decks (guest) | Não reproduziu pós-fix lab |

## Classificação

- **Critical:** 1 (warning contrast) — **fixed**
- **High:** contrast Store — **pass** pós-WebP/RSC path
- **Medium / Low:** sem falhas weighted no LH desktop após rebuild

## Evidência

Arquivos: `frontend/runtime_console_v3/lighthouse-reports/http___localhost_3000_*.json` (mtime 2026-07-14 ~00:51–00:53) + `rc12-quality-gates.json`.
