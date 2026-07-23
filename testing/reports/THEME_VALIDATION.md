# THEME VALIDATION — V6.4

## Escopo

Tokens em `game-theme.ts` + `game-themes.css` + sync semântico no portal.

## Resultados (texto / muted vs bg)

Todos os jogos: text e textMuted ≥ 4.5:1 contra `surfaces.bg` (amostra unitária).

## CTA vs primary (antes → depois)

| Game | Primary | Antes (#fff) | Depois |
|------|---------|--------------|--------|
| POKEMON | #FFCB05 | 1.52 FAIL | #0f172a PASS |
| SWU | #0EA5E9 | 2.77 FAIL | #0f172a PASS |
| SORCERY | #C89B3C | 2.56 FAIL | #0f172a PASS |
| DBFW | #F97316 | 2.80 FAIL | #0f172a PASS |
| VANGUARD | #22D3EE | 1.81 FAIL | #0f172a PASS |
| MTG | #C41E3A | 5.84 PASS | #ffffff PASS |

## Regra

`ctaForegroundForPrimary()` escolhe `#ffffff` ou `#0f172a` pelo melhor contraste ≥ 4.5.
