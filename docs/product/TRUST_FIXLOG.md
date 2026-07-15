# TRUST_FIXLOG.md — BP 5.2

Chronological perception-only changes for Trust Engineering (RC2→RC3). No runtime/API/DB feature work.

## Removed / rewritten (marketing sem prova)

- Home metadata: removed “maior marketplace”, “0% comissão”, “Zero comissão”.  
- `MarketplaceHeroSearch`: factual H1/sub; CTAs **Ver ofertas**; CEP na PDP + frete no carrinho.  
- `CatalogMarketplaceSection` hero: facts only; sem “Marketplace Neutro · 0%”.  
- `MarketplaceHomeRsc` / `MarketplaceFirstLanding`: claims 100% seguro / multi marketing → “Como funciona”; CTAs **Ver ofertas**; teasers comunidade/progresso removidos do funil.  
- Wishlist empty CTAs: **Ver ofertas**.  
- Stripe Connect panel: absolute “100% / sem comissão” → factual.

## Legal transparency (structure)

- `/politicas/compra`, `/cancelamento`, `/reembolso`, `/marketplace`.  
- `TrustFooterStrip`: CNPJ/endereço/contato + links; **warning** if env incomplete.  
- `brand.legalAddress` + `brandHasLegalTransparency()`.  
- Termos linkam políticas; footer landing inclui Compra/Reembolso.

## Financial language

- Checkout summary: “Taxa da compra protegida (3%)”.  
- Buylist: escrow → compra protegida.  
- `/comprador/financeiro`: human labels + **explicit** “não é checkout”.

## UI trust / clarity

- Seller offers: Trust → **Nota**.  
- TrustScore: sem estrela decorativa.  
- GameCard: Explorar → **Ver cartas**.  
- Decks / perfil seguidos: CTAs em português direto (`Ver decks públicos`, `Ver ofertas`).  
- Quick view + smart cart: “Trust” / ⭐ → **Nota**.

## PDP + carrinho (Continuidade 5.2)

- `PdpShippingCepField`: CEP na oferta; persiste `judgetcg_buyer_cep`; **sem preço inventado**.  
- `PdpPurchaseAssurance`: razão social / CNPJ (ou aviso honesto) + links Compra/Reembolso/Cancelamento/Ajuda.  
- Loja na PDP: link para `/vendedor/[id]` e avaliações.  
- `CartShippingQuotePanel`: consome **GET `/api/buyer/shipping/quote` existente**; autoload do CEP da PDP; login honesto se 401.

## Ops checklist (envs + ATF)

- `docs/product/PDP_ABOVE_FOLD_CHECKLIST.md` — vars exatas + o que deve entrar na dobra da PDP após publicar CNPJ.  
- **ATF layout:** `PdpLegalAtfLine` sob o preço; assurance só endereço/políticas; CEP/nota compactados.  
- Lembrete: vars no **host Next** + **redeploy**; API Render sozinha não popula o bundle da PDP.

## Still open (blocks TES 95 / Black Lotus)

1. Publish real CNPJ + endereço (env) — ver checklist acima.  
2. Cotação guest na PDP (API hoje exige auth + itens no carrinho — limitação consciente).  
3. Volume/histórico rico de reviews no bloco de loja (sem mocks).  
4. Guest→paid under 45s consistently.  
5. External auditor pass.

## Gate

**NO-GO** for BP 5.3 Landing Excellence until scorecard + psychological metrics pass.
