# TRUST_FIXLOG.md — BP 5.2

Perception-only. No runtime/API/DB features.

## Round 1–2 (anteriores)

Ver histórico: políticas, ATF, CEP, claims, CTAs, escrow PT, sparkles, gate placeholder CNPJ.

## Round 3 — pós-CNPJ real Vercel (`58.477.778/0001-76`)

### Verificado em produção

- Home `trust-footer`: CNPJ real, sem “ainda não publicado”.  
- Termos: operador + CNPJ + endereço.  
- PDP bundle: `cnpj=58.477.778/0001-76`, `data-legal-ready`, sem warning incompleto.

### Código (esta rodada)

- **Suporte:** `brand.supportEmail` unificado (era `contato@`).  
- **Carrinho:** `Checkout` → **Finalizar compra**; `TrustFooterStrip` no rodapé.  
- **Checkout:** trust line com operador+CNPJ+políticas; `TrustFooterStrip`; remove “conclua com segurança”.  
- **Seller profile / stores / decklist:** ⭐ → **nota**.  
- **MarketplaceFirstLanding:** remove “Sem surpresas”.

## Still open

1. Compra protegida opt-in vs alto valor.  
2. Mock sellers / demo shops / Render message.  
3. Volume reviews + autenticidade carta na PDP.  
4. TES ≥ 95, TTC/TTP gates.

## Gate

**NO-GO** BP 5.3.
