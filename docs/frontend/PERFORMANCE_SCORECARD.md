# Performance Scorecard — Sprint 19

**Data:** 2026-07-13  
**Lab:** desktop Lighthouse localhost pós-Sprint 19  
**Nota agregada:** **7.4 / 10**

## Lighthouse por página (depois)

| Página | Perf | A11y | BP | SEO | vs prod 18.5 |
|---|---:|---:|---:|---:|---|
| `/` | **99** | 92 | 96 | **100** | 79→99 |
| `/loja` | 74 | 93 | 96 | **100** | 77≈ |
| `/loja/busca` | 64 | 91 | 96 | **100** | 82→64* |
| `/checkout` | **96** | 92 | 96 | **100** | 94→96 |
| `/comprador` | **95** | 94 | 96 | **100** | 83→95 |
| `/marketplace/cart` | **97** | 96 | 96 | **100** | 99≈ |
| `/vendedor/painel` | **99** | **98** | 96 | **100** | 100≈ |
| `/decks` | **98** | **98** | 96 | **100** | 99≈ |

\*busca lab variance / cold cache — revalidar em prod.

## Dimensões

| Dimensão | Score | Nota |
|---|---:|---|
| Bundle shared | 4.0 | 341 KB (meta &lt;200 não atingida) |
| LCP Home | 9.0 | lab home ~ok pós-stream |
| LCP Loja | 5.0 | ainda &gt;2s |
| CLS | 9.0 | comprador 0 |
| Hydration / Providers | 8.0 | 4 providers fora do root |
| RSC / Streaming | 8.5 | home SSR-first |
| SEO | 9.5 | canonical 100 |
| A11y | 6.5 | marketplace ainda &lt;98 |
| BP | 6.0 | 96 (console + source maps) |

## Gates DoD

| Gate | Meta | Status |
|---|---|---|
| Perf `/` `/loja` `/comprador` / checkout ≥95 | | **Parcial** (`/loja` NOK) |
| Shared &lt;200 KB | | **NOK** |
| CLS &lt;0.05 | | **OK** (comprador) |
| LCP &lt;2s all | | **Parcial** |
| SEO 100 | | **OK** (lab) |
| A11y ≥98 | | **Parcial** |
| BP 100 | | **NOK** |
