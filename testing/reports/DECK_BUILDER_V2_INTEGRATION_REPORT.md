# DECK_BUILDER_V2_INTEGRATION_REPORT

**Persona:** Daniela  
**Gerado:** 2026-07-22  

| Integração | Como | Novo BC? |
|------------|------|----------|
| Catalog | stats/legalidades/imagens nas cartas do deck | Não |
| Collection | status por linha + tab Coleção | Não |
| Marketplace / Pricing | DeckShoppingPanel + buyer shop | Não |
| Checkout | add to cart existente | Não |
| Deck API | CRUD, validate, export, publish | Não |
| Analytics | Meta placeholders honestos | Não |

Import: pipeline `deck-importers.ts` → `resolveCards` (Catalog).  
Export: TXT/MTGO/JSON/CSV/JudgeTCG + Arena API.  
IA: slots apenas (`deck-ai-slots.ts`).

## Veredito

**APROVADO.** Boundaries respeitados.
