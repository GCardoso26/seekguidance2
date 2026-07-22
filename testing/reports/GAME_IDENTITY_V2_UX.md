# GAME_IDENTITY_V2 — UX

**Persona:** Juliana  
**Date:** 2026-07-22

## Checklist

| Pergunta | Resultado | Notas |
|----------|-----------|-------|
| Cada jogo parece um universo próprio? | ✅ | Mood light (Pokémon) vs dark medieval (MTG) vs neon (SWU) vs cyber (Digimon) etc. |
| A navegação emociona? | ✅ | Portal nav + CTAs no hero (singles, expansões, marketplace, decks) |
| O Hero impressiona? | ✅ | Full-bleed cinematic shell, overlay, CSS FX (fog/glow/stars/scanlines/aura/waves) |
| Os cards convidam? | ✅ | Large visual cards 420×560 com hover glow/lift por tema |

## Distinções chave (amostra)

| Jogo | Sensação |
|------|----------|
| Magic | Grimório, dourado discreto, tipografia serifada, fog |
| Pokémon | Claro, amarelo/azul, botões pill, espaço em branco |
| Lorcana | Brilho, constelações, accent ouro |
| One Piece | Madeira/mar, waves |
| SWU | Stars + neon HUD |
| Digimon | Hex + scanlines |
| Dragon Ball | Aura / power-up hover |
| Yu-Gi-Oh | Areia / runas / templo |

## Motion

Hover lift + glow via CSS variables; `prefers-reduced-motion` desliga animações do hero/FX.
