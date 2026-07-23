# QA_PLATFORM_V6_MARKETPLACE

**Verdict:** **PARTIAL**

## PASS
- Filtros preço desktop/mobile E2E **PASS** (fix: `syncURL` → `/marketplace/produtos`; redirect `/marketplace`→`/loja` descartava query)
- Seller lifecycle E2E **PASS**
- Search smoke (V5) mantido

## FAIL / residual
- KG em PDP escala (master_variant=1)
- Dual-path shop legado vs `marketplace.listings`

## Fix shipped
`MarketplaceShopBrowse.tsx` syncURL path correction.
