# TRUST_ENGINEERING_AUDIT.md — BP 5.2 (pós-CNPJ real)

**Date:** 2026-07-15  
**Production evidence:** `CNPJ 58.477.778/0001-76` · `JUDGE TCG LTDA` · endereço Osasco — home `trust-footer`, termos, bundle PDP `data-legal-ready` (gate passa).  
**Question:** Compraria uma Black Lotus de R$ 50.000 aqui?  
**Answer:** **Não.** (NO-GO)

## Scope

Perception only — copy, labels, legal face, CTAs, chrome. No new APIs/DB/runtimes.

---

## 1. Eliminado / melhorado (evidência)

| Área | Antes | Depois |
|------|-------|--------|
| Legal | CNPJ placeholder / warnings | **CNPJ Receita real** no build Vercel |
| Marketing | zero comissão, 100% seguro, inteligente | Factual no hot path |
| CTAs | Explorar, Checkout EN, hero duplo | Ver ofertas / Finalizar compra |
| Financeiro | custódia, Liberação, via Stripe | Compra protegida, Pago ao vendedor |
| Ícones | Sparkles/⭐ no path loja | Removidos na maior parte |
| ATF PDP | CNPJ abaixo do preço | `PdpLegalAtfLine` + assurance |
| Checkout/carrinho | Sem face legal | Rodapé + linha operador/CNPJ no checkout |
| Suporte | `contato@` vs `suporte@` | Unificado em `brand.supportEmail` |

---

## 2. O que ainda reduz confiança (objetivo)

### P0 — Black Lotus / R$ 5k+

| Bloqueador | Por quê |
|------------|---------|
| Compra protegida **opt-in** | R$50k sem retenção padrão — copy PDP promete mais que o default do checkout |
| Prova de loja rasa | Nota sem volume visível; sem grading/autenticidade na PDP |
| Mock sellers em falha API | Perfil fictício com Black Lotus no fallback (percepção de golpe se API cair) |
| Frete pós-login/carrinho | TTC/TTP ainda altos para impaciente |

### P1 — beta / template

| Bloqueador | Onde |
|------------|------|
| Mensagem “Render acordando” | `FacetedSearch` |
| Lojas demo no fallback | `FeaturedShopsGrid` |
| XP pós-compra | checkout success |
| Wallet/Analytics Demo | sandbox menu |
| Buyer dashboard Sparkles | off hot path |
| Privacidade curta vs expectativa LGPD fina | `/privacidade` |

### P2 — residual off-path

- Seller: “Zero comissão” em painéis  
- Onboarding “Começar”  
- Judge / premium / gamificação

---

## 3. Jurídico — checklist

| Item | Status |
|------|--------|
| Razão social | **OK** (env) |
| CNPJ real | **OK** `58.477.778/0001-76` |
| Endereço | **OK** |
| Contato | **OK** `suporte@judgetcg.com.br` |
| Políticas compra/cancelamento/reembolso/marketplace | **OK** |
| Termos ≠ Privacidade | **OK** |
| LGPD | **Parcial** (texto existe; densidade fina pendente) |
| Plataforma vs vendedor | **OK** (PDP + políticas) |
| Legal no checkout/carrinho | **Melhorado** (rodapé + trust line) |

---

## 4. Personas — desistência

| Persona | Ainda desiste porque |
|---------|----------------------|
| Golpe / paranoico | Escrow não padrão; mock seller; rotas `/marketplace` |
| Black Lotus | Sem autenticidade carta; proteção financeira opcional |
| Leigo | Auth + frete tardio |
| Impaciente | TTP > meta |
| Idoso | Densidade ok; chrome ainda “app” |
| Lojista | N/A para gate comprador |

---

## 5. Conclusão

CNPJ real **destrava face legal** e melhora TTFB/TES materialmente.  
**Não** atinge “Sim, sem hesitar” para Black Lotus.  
**BP 5.3 Landing Excellence: BLOCKED.** Continuar BP 5.2.
