# PSYCHOLOGICAL_METRICS.md — TTFB · TTC · TTP

**Method:** Expert walkthrough pós-CNPJ real (`58.477.778/0001-76`) em produção.

## Definitions

| Metric | Meaning | Meta |
|--------|---------|------|
| **TTFB** | “Esse site parece confiável” | &lt; 3 s |
| **TTC** | “Posso comprar aqui” | &lt; 15 s |
| **TTP** | Clique em **Comprar** | &lt; 45 s |

## Current estimates (home → PDP → Comprar)

| Metric | Estimate | Meta | Gate |
|--------|----------|------|------|
| TTFB | **~2.5–4 s** | &lt; 3 s | **BORDERLINE** (melhor caso ~2.5; típico ~3–4) |
| TTC | **~14–22 s** | &lt; 15 s | **FAIL** (melhor caso pode passar) |
| TTP | **~40–65 s** | &lt; 45 s | **FAIL** (melhor caso ~40) |

### TTFB — melhorou com CNPJ real

- Home `trust-footer`: razão social + CNPJ + endereço sem warning.  
- PDP bundle: `legalName` + CNPJ inlined; sem “incompleto”.  
- Ainda penaliza: header JT fallback, foto produto não dominante na home.

### TTC — ainda falha na mediana

- Frete oficial só no carrinho (auth).  
- Nota sem N avaliações.  
- Compra protegida não é default mental.

### TTP — borderline

- CTA único **Comprar** ajuda.  
- Login + carrinho + checkout alongam alto valor.

## Personas

| Persona | Métrica |
|---------|---------|
| Desconfiado | TTC (escrow opt-in) |
| Black Lotus | TTC |
| Impaciente | TTP |

## Gates obrigatórios

| Gate | Status |
|------|--------|
| TTFB &lt; 3 s | **BORDERLINE** |
| TTC &lt; 15 s | **FAIL** |
| TTP &lt; 45 s | **FAIL** |

Programa **NO-GO** até todas as metas + TES ≥ 95.
