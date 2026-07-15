# TRUST_ENGINEERING_SCORE.md — TES

**Program:** 5.2 · **Meta TES ≥ 95** · **Resultado: ~74 → NO-GO**

Weights as specified in the trust engineering brief.

| Dimension | Max | Score | Notes |
|-----------|----:|------:|-------|
| Brand Credibility | 20 | 12 | Marca mais sóbria; sem claim “maior”; ainda jovem / sem proof social densa |
| Legal Transparency | 15 | 9 | Políticas + bloco na PDP; **CNPJ+endereço ainda env-pendentes** |
| Financial Trust | 15 | 10 | CEP na PDP + cotação no carrinho (API real); frete guest na PDP ainda impossível sem auth |
| Seller Credibility | 10 | 7 | Nota + link perfil/avaliações; falta volume/n amostras |
| Checkout Confidence | 10 | 7 | Trust line + políticas coladas à oferta; login ainda no hot path |
| Visual Premium | 10 | 8 | Ink + tipografia própria; shells admin ainda “produto” |
| Navigation Clarity | 10 | 8 | Header one-goal Loja; CTAs residual limpos |
| Language Clarity | 10 | 8 | Glossary + Nota vs Trust |
| Information Density | 5 | 4 | CEP + assurance na PDP melhoram densidade sem clutter card-spam |
| Consistency | 5 | 3 | Loja ok; torneio/financeiro shells divergem |
| **TOTAL TES** | **100** | **~74** | **&lt; 95** |

## Black Lotus gate

| Question | Answer |
|----------|--------|
| Eu compraria uma Black Lotus de R$ 50.000 aqui? | **Não** |
| Sem hesitar? | **Não** |

## Unlock TES ≥ 95 (minimum)

1. CNPJ + razão social + endereço reais em prod (Legal Transparency → ≥14).  
2. Guest frete ou auth friction quase zero no path de alto valor.  
3. Seller block com volume de reviews real (não placeholder).  
4. Checkout path &lt; login friction for returning buyer.  
5. Re-audit marketing zero false remaining.

Until then: **TES fail · roadmap 5.3 blocked.**
