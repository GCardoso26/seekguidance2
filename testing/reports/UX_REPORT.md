# UX_REPORT — AUDIT_PASS_2026-07-29

## Percurso HTTP (shell only)

Rotas beachhead respondem 200: home, lorcana portal, expansions, loja, busca.

## Issues com evidência

| Item | Evidência |
|---|---|
| Mobile nav labels mudaram (Perfil→Alertas/Coleção) | Vitest MobileLayout falhava; teste alinhado ao V2 |
| GameSelector aria/label drift | Teste falha: radiogroup name `/escolha seu jogo/i` |
| CVC 2026-07-23: navegação 2.8/10 | Arquivo customer-score.json |

## Não feito

Walkthrough visual browser, dark/tablet, contraste WCAG medido, empty/error states filmados.

## Veredito UX

**Não aprovado para READY.** Shell ok ≠ experiência de compra.
