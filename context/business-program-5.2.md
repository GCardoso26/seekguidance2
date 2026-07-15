# Business Program 5.2 — Trust Engineering (RC2 → RC3)

**Mode:** Perception / confiança only  
**Forbidden:** new features, APIs, DB, business rules, Analytics/Tournament/Financial runtimes  

## Goal question

> “Eu compraria uma Black Lotus de R$ 50.000 aqui?”  
> Required: **“Sim, sem hesitar.”**

**Current answer: NO** — **NO-GO** for BP 5.3.

## Deliverables

| File | Purpose |
|------|---------|
| `docs/product/TRUST_ENGINEERING_AUDIT.md` | Full audit |
| `docs/product/TRUST_ENGINEERING_SCORE.md` | TES |
| `docs/product/PSYCHOLOGICAL_METRICS.md` | TTFB / TTC / TTP |
| `docs/product/TRUST_FIXLOG.md` | Fixes |
| `docs/product/PDP_ABOVE_FOLD_CHECKLIST.md` | ENVs + ATF |
| this file | Context |

## Gate summary (pós-CNPJ real)

| Gate | Meta | Status |
|------|------|--------|
| TES | ≥ 95 | **~86 — FAIL** |
| TTFB | &lt; 3 s | **~2.5–4 s — BORDERLINE** |
| TTC | &lt; 15 s | **~14–22 s — FAIL** |
| TTP | &lt; 45 s | **~40–65 s — FAIL** |
| CNPJ Receita real | required | **PASS** (`58.477.778/0001-76`) |
| Zero marketing vazio (hot path) | required | **Mostly PASS** |
| Zero CTAs fracos (hot path) | required | **Mostly PASS** |
| Zero jargão financeiro sem tradução (hot path) | required | **Mostly PASS** |
| Zero info jurídica ausente | required | **PASS** |
| Zero componentes infantis (hot path) | required | **Mostly PASS** |
| Black Lotus sem hesitar | yes | **NO** |
| Start BP 5.3 | all pass | **BLOCKED** |

## Relatório final (obrigatório)

### O que reduzia confiança e foi eliminado

Claims sem prova (zero comissão, 100% seguro, inteligente); CTAs fracos; escrow cru; sparkles/emoji no path loja; CNPJ placeholder; suporte com e-mails divergentes; checkout/carrinho sem face legal.

### O que ainda impede confiança absoluta

Compra protegida opt-in; prova de loja/autenticidade rara; frete/auth friction; cheiro beta (Render, demo, XP); mocks em falha; inconsistência fora da loja.

### Métricas

- **TES:** ~86  
- **TTFB:** ~2.5–4 s (borderline)  
- **TTC:** ~14–22 s  
- **TTP:** ~40–65 s  

### Black Lotus R$ 50k

**Não** transmite confiança suficiente para compra sem hesitar.

### BP 5.3 Landing Excellence

**Não iniciar.** Critérios mínimos **não** atingidos.

## Next (stay on 5.2)

1. Percepção de Compra protegida para alto valor (copy/default UI — sem nova API).  
2. Eliminar cheiro beta no hot path (mensagens Render, demo).  
3. Densidade de prova da loja com dados reais.  
4. Re-score até TES ≥ 95 e TTC/TTP passarem.
