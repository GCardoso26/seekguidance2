# UX_REPORT

**Persona:** Juliana (UX)  
**Gerado:** 2026-07-22T06:55:00Z  
**Status:** **WARN** · Confidence **55%**

## Percurso Home → Portal → Carta → Coleção → Deck → Marketplace → Perfil → Home

| Etapa | Evidência HTTP prod | Nota |
|-------|---------------------|------|
| Home | `/` 200 | OK |
| Escolher jogo / Portal | `/pokemon` `/lorcana` `/mtg` 200; `/magic` `/star-wars` `/dragon-ball` `/gundam` **404** | Multi-TCG **parcial** |
| Carta | PDP fixture Renato **404** | Risco descoberta |
| Coleção | `/colecao` 200 | Collection V2 |
| Deck | `/decks` 200 | Deck V2 |
| Marketplace | `/loja` 200 | OK |
| Perfil | `/perfil` 200 (markers Profile V2) | OK |
| Público | `/u/demo` 200 | OK |

## Runner

Juliana → **partial** uxScore **6.5** — “campanha visual exige browser supervisionado”

## Pergunta: entende a plataforma em &lt;10s?

**Não comprovado por evidência de sessão supervisionada.**  
Indícios positivos: home multi-TCG + portais com SEO.  
Indícios negativos: slug `/magic` 404 (usuário pode digitar “magic” e falhar; canônico parece `/mtg`).

## Gaps

Dark mode, skeletons, empty states, a11y WCAG, Lighthouse — **não medidos** nesta rodada.

## Veredito

UX de superfície **promissora**, **não** certificada para Beta.
