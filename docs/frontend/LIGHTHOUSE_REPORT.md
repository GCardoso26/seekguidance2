# Lighthouse Report — Sprint 18.5

**Data:** 2026-07-13  
**BASE_URL (depois):** `http://localhost:3000` (build local pós-hardening)  
**BASE_URL (antes):** `https://judgetcg.com.br` (`context/rc1-lighthouse-report.md`)  
**Preset:** **desktop** (`scripts/lighthouse-audit.js` atualizado: formFactor + throttle desktop)

> Comparar localhost vs prod CDN tem viés (edge cache / HW). Mesmo assim, desktop local pós-otimização supera o baseline prod desktop nas rotas críticas.

## Antes (prod desktop — RC1)

| URL | Perf | A11y | BP | SEO |
|---|---:|---:|---:|---:|
| `/` | 58 | 96 | 96 | 100 |
| `/loja` | 69 | 96 | 96 | 92 |
| `/loja/mtg` | 62 | 96 | 96 | 100 |
| `/loja/busca` | 64 | 95 | 96 | 92 |
| `/marketplace/cart` | 80 | 96 | 96 | 92 |
| `/checkout` | 68 | 96 | 96 | 92 |
| `/comprador` | 81 | 94 | 96 | 92 |
| `/vendedor/painel` | 87 | 98 | 100 | 92 |
| `/vendedor/painel/estoque` | 87 | 98 | 100 | 92 |
| `/decks` | 83 | 98 | 96 | 92 |

## Depois (local desktop — Sprint 18.5)

| URL | Perf | A11y | BP | SEO | Δ Perf |
|---|---:|---:|---:|---:|---:|
| `/` | **94** | 92 | 96 | **100** | **+36** |
| `/loja` | **87** | 93 | 96 | **100** | **+18** |
| `/loja/mtg` | **85** | 93 | 96 | **100** | **+23** |
| `/loja/busca` | **79** | 91 | 96 | **100** | **+15** |
| `/marketplace/cart` | **97** | 92 | 96 | **100** | **+17** |
| `/checkout` | **95** | 92 | 96 | **100** | **+27** |
| `/comprador` | **80** | 91 | 96 | **100** | −1 |
| `/vendedor/painel` | **98** | **98** | 96 | **100** | **+11** |
| `/vendedor/painel/estoque` | **98** | **98** | 96 | **100** | **+11** |
| `/decks` | **97** | **98** | 96 | **100** | **+14** |

## Metas Sprint 18.5 vs resultado

| Meta | Alvo | Status |
|---|---|---|
| Performance ≥95 (global) | ≥95 | **Parcial** (home 94; loja/busca/comprador abaixo) |
| Accessibility ≥98 | ≥98 | **Parcial** (painel/decks OK; marketplace falha `color-contrast`) |
| Best Practices =100 | 100 | **Não** (96 estável) |
| SEO ≥100 / =100 | 100 | **Atingido** nas rotas auditadas pós-metadata |

## Web Vitals (depois — desktop)

| URL | LCP | FCP | CLS | TBT | TTFB doc |
|---|---|---|---|---|---|
| `/` | 1.6 s | 0.3 s | 0 | 40 ms | ~10 ms |
| `/loja` | 2.5 s | 0.4 s | 0 | 40 ms | ~10 ms |
| `/loja/busca` | 3.7 s | 0.3 s | 0.003 | 90 ms | ~0 ms |
| `/checkout` | 1.5 s | 0.4 s | 0.005 | 20 ms | ~10 ms |
| `/vendedor/painel` | 1.0 s | 0.3 s | 0 | 50 ms | ~10 ms |
| `/comprador` | 1.4 s | 0.4 s | **0.315** | 10 ms | ~10 ms |

### Gate Web Vitals

| Métrica | Meta | Status |
|---|---|---|
| LCP &lt;2.0s | | Home/checkout/seller OK; loja/busca **NOK** |
| CLS &lt;0.05 | | NOK em `/comprador` (0.315) |
| TBT &lt;150ms | | **OK** em todas |
| FCP &lt;1.2s | | **OK** |
| TTFB &lt;500ms | | **OK** (local) |

## Auditorias críticas

- **A11y:** `color-contrast` em rotas marketplace (não corrigido — risco visual se alterar tokens às cegas).
- **BP 96:** sem elevação a 100 nesta sprint (provável console/CSP/extensões de third-party).

Artefatos: `frontend/runtime_console_v3/lighthouse-reports/*.json|html` (gitignored) · `docs/frontend/LIGHTHOUSE_DESKTOP_FINAL.txt`
