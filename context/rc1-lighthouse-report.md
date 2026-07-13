# RC1 Lighthouse Report

**Data:** 2026-07-13  
**Ferramenta:** `node scripts/lighthouse-audit.js` (fix `lighthouse.default`)  
**BASE_URL:** https://judgetcg.com.br  
**Preset:** desktop headless (chrome-launcher)  
**Metas RC1:** Performance/A11y/BP/SEO ≥ **95**

## Scores (desktop)

| URL | Perf | A11y | BP | SEO | ≥95 all? |
|---|---:|---:|---:|---:|---|
| `/` | 58 | 96 | 96 | 100 | NÃO (P) |
| `/loja` | 69 | 96 | 96 | 92 | NÃO |
| `/loja/mtg` | 62 | 96 | 96 | 100 | NÃO (P) |
| `/loja/busca` | 64 | 95 | 96 | 92 | NÃO |
| `/marketplace/cart` | 80 | 96 | 96 | 92 | NÃO |
| `/checkout` | 68 | 96 | 96 | 92 | NÃO |
| `/comprador` | 81 | 94 | 96 | 92 | NÃO |
| `/vendedor/painel` | 87 | 98 | 100 | 92 | NÃO |
| `/vendedor/painel/estoque` | 87 | 98 | 100 | 92 | NÃO |
| `/decks` | 83 | 98 | 96 | 92 | NÃO |

## Conclusão

- **Accessibility:** majoritariamente ≥95 (exceto `/comprador` 94).  
- **Best Practices:** ≥95 em todas.  
- **SEO:** várias em 92 (abaixo da meta).  
- **Performance:** **nenhuma** página ≥95 (58–87).

**Blocker B5 permanece aberto** para o critério estrito RC1 ≥95.  
Otimizações de bundle/SSR foram registradas em `post-beta-backlog.md` (feature freeze — sem implementação nesta fase).

## Artefatos locais

`frontend/runtime_console_v3/lighthouse-reports/*.json|html` (gitignored).
