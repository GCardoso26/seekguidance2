# Business Program 5.2 — Trust Engineering (RC2 → RC3)

**Mode:** Perception / confiança only  
**Forbidden:** new features, APIs, DB, business rules, Analytics/Tournament/Financial runtimes  

## Goal question

> “Eu compraria uma Black Lotus de R$ 50.000 aqui?”  
> Required answer: **“Sim, sem hesitar.”**

**Current answer: NO** — program = **NO-GO** for BP 5.3.

## Deliverables

| File | Purpose |
|------|---------|
| `docs/product/TRUST_ENGINEERING_AUDIT.md` | Full trust audit |
| `docs/product/TRUST_ENGINEERING_SCORE.md` | TES breakdown |
| `docs/product/PSYCHOLOGICAL_METRICS.md` | TTFB / TTC / TTP |
| `docs/product/TRUST_FIXLOG.md` | What was fixed |
| `docs/product/PDP_ABOVE_FOLD_CHECKLIST.md` | ENVs legais exatos + ATF PDP pós-CNPJ |
| this file | Program context |

## Gate summary

| Gate | Meta | Status |
|------|------|--------|
| TES | ≥ 95 | **~74 — FAIL** |
| TTFB | &lt; 3 s | **~4–6 s — FAIL** |
| TTC | &lt; 15 s | **~15–24 s — FAIL** (melhora vs 18–30) |
| TTP | &lt; 45 s | **~45–75 s — FAIL** |
| Legal CNPJ+endereço published | required | **FAIL** (env empty) |
| Black Lotus confidence | yes without hesitation | **NO** |
| Start BP 5.3 Landing Excellence | only if all above pass | **BLOCKED** |

## Done this continuity (perception)

- CEP na PDP (`PdpShippingCepField`) + políticas/legal colados (`PdpPurchaseAssurance`).  
- Carrinho cota frete com API já existente (`CartShippingQuotePanel`).  
- Loja na PDP com link perfil/avaliações; CTAs “Explorar” residual limpos; Trust→Nota.

## Next work (stay on 5.2)

1. Publish real `NEXT_PUBLIC_CNPJ`, `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_ADDRESS`.  
2. Reduzir friction de login no path de cotação (sem inventar API guest de frete).  
3. Densidade de prova da loja com dados reais (sem mocks).  
4. Re-score TES after CNPJ live; only then unlock 5.3.
