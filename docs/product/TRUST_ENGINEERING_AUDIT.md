# TRUST_ENGINEERING_AUDIT.md — BP 5.2

**Date:** 2026-07-15  
**Question:** Compraria uma Black Lotus de R$ 50.000 aqui?  
**Answer:** **Não.** (NO-GO)

## Scope respected

- No new product features, APIs, DB, or runtime behavior for money/tournament/analytics cores.  
- Perception: copy, legal pages, CTAs, chrome, labels, metadata.

## What reduced trust (and status)

| Issue | Severity | Status |
|-------|----------|--------|
| “Maior marketplace” / “0% comissão” / “compra garantida” / “100% seguro” | P0 | **Removed** from primary heroes + home metadata |
| Termos = Privacidade | P0 | **Fixed** earlier; policies expanded |
| Missing compra/cancelamento/reembolso/marketplace policies | P0 | **Pages created** under `/politicas/*` |
| CNPJ / endereço not published | P0 | **Still open** — fields exist, env empty → footer warns |
| Escrow jargon in checkout summary | P1 | **Relabeled** to compra protegida |
| Dual money / wallet looking like checkout cash | P0 | **Honest disclaimer** on comprador/financeiro |
| Weak CTAs (Explorar, Comece agora) | P1 | **Mostly → Ver ofertas** on store surfaces |
| Decorative star / SaaS indigo / emoji logo | P1 | **Mitigated** in BP 5.1 + TrustScore |
| Teasers community/judge interrupting buy path | P1 | **Removed** on main marketplace homes |
| Seller “Trust EN” in offer table | P2 | **→ Nota** |
| Stripe “100% / sem comissão” absolute | P1 | **Softened to factual** |
| Frete only after cart | P0 for high ticket | **Mitigated** — CEP na PDP + cotação no carrinho via API existente; preço na PDP guest ainda não (auth/cart) |
| Auth funnel remnants | P0 | Largely fixed BP5; residual risk |

## Personas: why they still abandon

| Persona | Still abandons because |
|---------|------------------------|
| Desconfiado / golpe | Sem CNPJ+endereço reais na face; claim history recent |
| Black Lotus / alto valor | Sem legitimidade fiscal visível + frete guest limitado + reputação de loja ainda rasa |
| Idoso | Ainda densidade e jargão residual fora do funil principal |
| Impaciente | TTP ainda alto se login/frete atrapalham |
| Lojista | Out of scope for buyer Black Lotus; ops not trust gate for this question |
| Paranoico | Wallet page + financial platform shells exist elsewhere |

## Marketing claim sweep (buyer-facing)

Removed/rewritten where found on home, heroes, RSC home, catalog hero, metadata. Remaining buy-path CTAs prefer **Ver ofertas / Comprar / Anunciar**; decks usa “Ver decks públicos”.

## Continuity (same day)

- PDP: CEP persistido + bloco legal/políticas colado à compra.  
- Carrinho: `CartShippingQuotePanel` → `/api/buyer/shipping/quote`.  
- Seller PDP: link perfil + avaliações.  
- TES ~74; gates still FAIL; **5.3 blocked**.

## Legal checklist

| Item | Present? |
|------|----------|
| Razão social (config) | Sim (env / default name) |
| CNPJ published | **Não** sem env |
| Endereço | **Não** sem env |
| Contato | Sim (email) |
| Política de compra | Sim `/politicas/compra` |
| Cancelamento | Sim |
| Reembolso | Sim |
| Regras marketplace | Sim |
| Termos ≠ Privacidade | Sim |
| LGPD | Privacidade |
| Responsabilidade plataforma vs vendedor | Sim (textos) |

## Template / childrens’ UI

Mitigated: ink palette, Plex/Serif, no hero purple gradient on primary heroes, no pulse on home stream fallback, JT mark. Not yet “studio for 15 years” across seller admin / tournament shells.

## Conclusion

Trust engineering **improved materially** but **does not** meet Black Lotus / R$ 50k confidence. Continue BP 5.2; **do not start BP 5.3**.
