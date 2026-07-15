# PSYCHOLOGICAL_METRICS.md — TTFB · TTC · TTP

**Method:** Expert walkthrough of store-facing surfaces post BP 5 / 5.1 / 5.2 fixes (not lab eye-tracking). Re-measure after CNPJ publish.

## Definitions

| Metric | Meaning | Meta |
|--------|---------|------|
| **TTFB** | Time to First Belief — “este site parece confiável” | &lt; 3 s |
| **TTC** | Time to Confidence — “posso comprar aqui” | &lt; 15 s |
| **TTP** | Time to Purchase click — first intentional Comprar | &lt; 45 s |

## Current estimates (homepage → PDP → Comprar)

| Metric | Estimate | Meta | Gate |
|--------|----------|------|------|
| TTFB | **4–6 s** | &lt; 3 s | **FAIL** |
| TTC | **15–24 s** | &lt; 15 s | **FAIL** (melhorou vs ~18–30; ainda acima) |
| TTP | **45–75 s** | &lt; 45 s | **FAIL** (borda; auth/CNPJ ainda alongam alto valor) |

### Why TTFB &gt; 3 s

- CNPJ/endereço ausentes ou aviso de “não publicado” na dobra legal (bom honestidade, má First Belief).  
- Sem fotografia de produto dominante no primeiro viewport.  
- Header/JT ainda “produto novo” sob auditoria Apple.

### Why TTC still ≥ 15 s

- CEP na PDP melhora percepção, mas **preço de frete** só após carrinho + login.  
- Nota da loja ainda sem volume de reviews óbvio.  
- Políticas agora coladas à oferta (ganho); legal face ainda incompleta.

### Why TTP still ≥ 45 s (alto valor)

- Busca → PDP → possível login → carrinho → cotação.  
- Comprar único CTA reduz ruído; Black Lotus ainda exige prova fiscal + loja.

## Persona stress (psychological)

| Persona | Dominant fail metric |
|---------|----------------------|
| Golpe / paranoico | TTFB (legal face) |
| Black Lotus | TTC (legitimacy + seller) |
| Impaciente | TTP (steps) |
| Leigo | TTC (language residual off-path) |

## After CNPJ+address + guest/zero-friction freight (projected)

| Metric | Projected |
|--------|-----------|
| TTFB | ~2–3 s |
| TTC | ~10–14 s |
| TTP | ~35–45 s |

Even then, **R$ 50k** may need more seller proof — re-score before claiming pass.
