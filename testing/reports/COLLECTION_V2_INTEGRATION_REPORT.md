# COLLECTION_V2_INTEGRATION_REPORT

**Persona:** Daniela (Catalog / Pricing / Marketplace / Collection)  
**Gerado:** 2026-07-22  

## Integrações

| Domínio | Como | Novo BC? |
|---------|------|----------|
| Collection | `/runtime/judge/user/collection` via BFF | Não |
| Catalog | card detail + search + sets (faltantes / preços) | Não |
| Pricing | price-history agregado no BFF insights | Não |
| Marketplace | links compra + publish listing duplicatas | Não |
| Wishlist | hooks/UI existentes embutidos | Não |
| Deck | `useMyDecks` / public decks na PDP e duplicatas | Não |
| Analytics | liquidez placeholder até score público estável | Não |

## Restrições

- Sem SQL cross-schema
- Sem duplicar Pricing na UI (série/valor montados no BFF a partir de APIs públicas)
- Feature flags: `COLLECTION_V2`, `COLLECTION_ALERTS`

## Veredito Daniela

**APROVADO.** Boundaries respeitados. Gaps conscientes: selados/acessórios, sales timeline, push de alertas.
