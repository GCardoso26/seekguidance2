# Auditoria de Logos TCG

Auditoria realizada em **2026-06-06** para os **14 TCGs** suportados na mesa `/judge` (catálogo `TCG_OPTIONS`).

> **Nota:** O briefing menciona Shadowverse Evolve, Weiß Schwarz e Battle Spirits Saga; o produto atual usa **Gundam**, **Riftbound** e **Sorcery** no lugar desses títulos. Esta auditoria reflete o catálogo real do repositório.

| TCG | Slug | Arquivo | Formato | Tamanho | Status | Ação |
|-----|------|---------|---------|---------|--------|------|
| Magic: The Gathering | `mtg` | `/logos/mtg.svg` | SVG | ~156 KB | OK | — |
| Pokémon TCG | `pokemon` | `/logos/pokemon.svg` | SVG | ~222 KB | OK | — |
| Yu-Gi-Oh! | `yugioh` | `/logos/yugioh.svg` | SVG | ~126 KB | OK | — |
| Disney Lorcana | `lorcana` | `/logos/lorcana.svg` | SVG | ~43 KB | OK | — |
| One Piece Card Game | `onepiece` | `/logos/onepiece.svg` | SVG | ~61 KB | OK | — |
| Flesh and Blood | `fab` | `/logos/fab.svg` | SVG | ~255 KB | OK | — |
| Gundam Card Game | `gundam` | `/logos/gundam.svg` | SVG | ~14 KB | OK | — |
| Digimon Card Game | `digimon` | `/logos/digimon.svg` | SVG | ~74 KB | OK | — |
| Dragon Ball Super Fusion World | `dbfw` | `/logos/dbfw.svg` | SVG | ~65 KB | OK | — |
| Sorcery: Contested Realm | `sorcery` | `/logos/sorcery.svg` | SVG | ~344 KB | OK | — |
| Cardfight!! Vanguard | `vanguard` | `/logos/vanguard.svg` | SVG | ~343 KB | OK | — |
| Riftbound | `riftbound` | `/logos/riftbound.svg` | SVG | ~5 KB | OK | Vetor compacto; válido em 120px |
| Union Arena | `union_arena` | `/logos/union-arena.svg` | SVG | ~20 KB | OK | — |
| Star Wars: Unlimited | `swu` | `/logos/swu.svg` | SVG | Vetor | Corrigido | Asset dedicado criado (antes: `default-tcg.svg`) |

## Checklist por logo

- [x] Arquivo existe (14/14 SVG)
- [x] Resolução vetorial ou alta (exibição até 120px)
- [x] Formato SVG com transparência
- [x] Contraste aceitável em fundo onyx (`#0a0a0f`)
- [x] Proporção preservada via `object-contain`
- [x] Componente `TCGLogo` com modo monocromático e hover temático

## Logos substituídos nesta entrega

1. **Star Wars: Unlimited** — `default-tcg.svg` → `swu.svg` (identidade escura + tipografia estilizada)

## Fontes oficiais (referência de marca)

| Editora / marca | TCGs |
|-----------------|------|
| Wizards of the Coast | Magic |
| The Pokémon Company | Pokémon |
| Konami | Yu-Gi-Oh! |
| Ravensburger | Disney Lorcana |
| Bandai | One Piece, Digimon, Dragon Ball, Gundam, Union Arena |
| Legend Story Studios | Flesh and Blood |
| Erik's Curiosa | Sorcery |
| Bushiroad | Vanguard |
| Riot Games | Riftbound |
| Fantasy Flight Games | Star Wars: Unlimited |

## Implementação técnica

- Mapa: `src/lib/tcg-logos.ts` + `src/lib/judge-game-slug.ts`
- Componente: `src/components/judge/TCGLogo.tsx`
- Wrapper legado: `src/components/judge/TcgLogoImage.tsx`
- Testes: `tests/lib/tcg-logos.test.ts`

## Fallback

`/logos/default-tcg.svg` permanece como placeholder genérico quando um slug desconhecido é referenciado.
