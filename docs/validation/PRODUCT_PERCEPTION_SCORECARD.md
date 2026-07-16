# PRODUCT_PERCEPTION_SCORECARD — BP 5.1

**Date:** 2026-07-15  
**Weights (PPS):** Trust 15% · Premium 12% · Simplicity 12% · Clarity 12% · Marketplace 12% · Perf perc. 10% · Consistency 8% · Identity 8% · A11y 6% · Delight 5%

Legend: valores **antes → depois do Sprint 5.1 visual** (estimado por auditoria de código/UI; auditor externo ainda necessário).

## PPS por superfície

| Superfície | Trust | Prem | Simp | Clar | Mkt | Perf | Cons | Ident | A11y | Del | PPS | ≥95? |
|------------|------:|-----:|-----:|-----:|----:|-----:|-----:|------:|-----:|----:|----:|:----:|
| Landing / Loja | 78→88 | 55→82 | 70→86 | 72→88 | 68→85 | 65→80 | 70→88 | 50→84 | 75→86 | 60→78 | **~84** | Não |
| PDP carta | 72→86 | 60→80 | 75→90 | 70→92 | 78→88 | 70→78 | 72→86 | 55→80 | 78→88 | 65→80 | **~85** | Não |
| Carrinho | 70→82 | 58→78 | 68→84 | 75→88 | 80→88 | 72→82 | 70→84 | 52→78 | 76→86 | 55→72 | **~82** | Não |
| Checkout | 65→80 | 60→80 | 60→78 | 68→84 | 75→86 | 60→75 | 68→82 | 50→76 | 74→84 | 50→70 | **~79** | Não |
| Perfil / Conta | 70→78 | 55→75 | 65→80 | 70→82 | 55→70 | 70→78 | 68→80 | 50→74 | 75→84 | 55→70 | **~76** | Não |
| Painel lojista | 65→72 | 50→70 | 55→78 | 60→80 | 40→55 | 65→75 | 65→78 | 45→70 | 70→80 | 50→65 | **~71** | Não |
| Torneio ops | 55→65 | 40→55 | 45→70 | 50→72 | 30→40 | 60→70 | 50→65 | 40→60 | 65→75 | 40→55 | **~61** | Não |

**Nenhuma superfície ≥ 95.** Programa 5.1 **aberto**.

## PAS (Product Aura)

| Métrica | Antes | Depois 5.1 | Meta | Gap |
|---------|------:|----------:|-----:|-----|
| Aura (parece produto milionário) | 42 | 72 | 95 | −23 |
| Memorabilidade (5s) | 35 | 70 | 95 | −25 |
| Elegância (menos elementos) | 48 | 75 | 95 | −20 |
| Confiança de gasto (R$) | ~200 | ~800 | 5000+ | longe |
| Clareza comprar (s) | ~12–20 | ~6–8 | &lt;5 | −1–3s |

## Plano de ação (só percepção — sem features)

### P0 confiança
1. Publicar CNPJ real (`NEXT_PUBLIC_CNPJ`) + razão social em todas as superfícies trust.
2. Checkout: uma linha humana “Quem recebe o pagamento / o que acontece se der errado”.
3. Remover qualquer residual de “sandbox/demo” do caminho de compra.

### P0 identidade / premium
4. Completar migração tipográfica (corpo + display) em marketing legacy.
5. Ícones Lucide: reduzir densidade; wordmark proprietário (SVG) no lugar de geometria genérica.
6. Fotografia/atmosfera de carta real no hero (não gradiente).

### P0 simplicidade
7. Header store-mode: só Loja · busca · carrinho · entrar (Vender/Regras fora do caminho hot).
8. Seller sticky actions: cortar para 2–3 ações de estoque.

### P0 velocidade percebida
9. Prefetch `/carrinho` e `/loja/busca` no hover do CTA Comprar.
10. Zero `animate-pulse` restantes em caminhos de compra.

### Torneio / admin
11. Não “premiumizar” JSON — manter deep-link até UI de piso exceler (já BP5); PPS torneio sobe só com ops human.

## Testes aplicados (Sprint 5.1)

| Teste | Ação tomada |
|-------|-------------|
| Apple (sem logo) | Ink primary + Plex · menos Inter/roxo |
| Stripe | Removeu ThemeToggle + LevelBadge do header de compra |
| Shopify | — (CEP auto PDP ainda backlog) |
| Amazon | Nota da loja com explicação curta |
| ML | Trust footer + termos |
| Linear | Header sólido sem blur; pulse off |
| Notion | Landing enxuta (já BP5) |
| Steam | Sem gamificação no header de compra |

## Critério de fechamento 5.1

Auditor externo sem contexto classifica percepção como marketplace maduro **e** PPS ≥ 95 em Landing, PDP, Carrinho, Checkout.
