# Judge — Sistema de Design "Galeria"

> Contexto de implementação do redesign **Galeria** em todo o ecossistema Judge
> (`frontend/runtime_console_v3`: vitrine, perfil, coleção, vendedor, judge, torneios, admin).
>
> Fontes: `direcoes-paleta-nomes.html` (direção "Galeria — a carta é a cor", 9/10 de inovação) ·
> `brand-spec.md` (tipografia e regras herdadas) · `auditoria-navegacao-tcg.html` (correções a aplicar junto) ·
> código-fonte: `src/styles/design-tokens.css`, `src/styles/tcg-theme.ts`, `src/lib/luxury-routes.ts`.

---

## 1. Tese da direção

**Galeria trata a carta como objeto de museu: a interface é neutra e quase desaparece; a única cor em cena vem da arte da carta.** É a resposta "anti-cor" à fragmentação de skins neon por TCG e ao vão aberto do "editorial de colecionador" que nenhum incumbente ocupa (TCGPlayer/Cardmarket são claros e indistinguíveis; os conceitos de Dribbble/Behance são dark + neon).

Três regras governam tudo:

1. **Concha neutra** — paredes de galeria, quase monocromáticas. Nunca mais uma superfície escura/neon por jogo.
2. **Arte como fonte de cor** — o colecionável dá a cor; a UI apenas enquadra.
3. **Um selo índigo** — o acento do sistema é único; por jogo, apenas um fio de 1px de taxonomia.

Posição frente às outras direções:

- **Galeria** = escolhida para o núcleo (vitrine, perfil, compra, painéis).
- **Noite de Leilão** = camada contextual opcional, apenas hubs, coleções e lançamentos (§7).
- **Tinta sobre Papel** = fallback de baixo risco se a curadoria de arte não acompanhar.

O gesto único do sistema: o **fio de galeria** — 1px de `--border` com 1px de respiro interno no enquadramento da carta. Um só floreio, reutilizado em vitrine, selos e destaques.

---

## 2. Tokens de cor

**Fonte de verdade: `oklch()`.** Derivados são gerados por conversão a partir destes valores; nenhum hex novo entra no código.

### Core

| Token | Valor | Papel |
|---|---|---|
| `--bg` | `oklch(.945 .004 90)` | parede da galeria — quente e neutra |
| `--surface` | `oklch(.98 .003 90)` | cartões, painéis |
| `--surface-2` | `oklch(1 .002 90)` | elevado / hover de cartão |
| `--fg` | `oklch(.24 .012 255)` | texto primário (tinta azulada) |
| `--muted` | `oklch(.44 .018 250)` | texto secundário (≥4.5:1 sobre `bg`) |
| `--border` | `oklch(.88 .006 90)` | fio de 1px — agrupa, não sombreia |
| `--selo` | `oklch(.44 .17 250)` | **único acento** do sistema |
| `--on-selo` | `oklch(.985 .006 240)` | texto sobre o selo |

O índigo do selo é contido pela própria tese anti-cor: aparece como CTA, foco e fio de taxonomia, **nunca como lavagem de superfície** (a base atual tem a regra "não indigo SaaS"; ela se mantém — o selo é micro-acento, não o tom da interface).

### Derivados de estado (L movida ±0.06–0.12)

| Token | Valor | Uso |
|---|---|---|
| `--selo-hover` | `oklch(.38 .16 250)` | hover do CTA primário |
| `--selo-press` | `oklch(.34 .15 250)` | pressed |
| `--selo-soft` | `color-mix(in oklch, var(--selo) 10%, var(--surface))` | item selecionado / ativo |
| `--ring` | `oklch(.44 .17 250 / .55)` | `:focus-visible` — 3px, `outline-offset: 2px` |
| `--disabled-bg` | `oklch(.92 .005 90)` | desabilitado |
| `--disabled-fg` | `oklch(.70 .012 250)` | desabilitado (único estado que reduz contraste) |

### Semânticos

| Token | Valor | Token | Valor |
|---|---|---|---|
| `--success` | `oklch(.48 .13 155)` | `--success-fg` | `oklch(.99 .01 255)` |
| `--warning` | `oklch(.54 .14 75)` | `--warning-fg` | `oklch(.20 .025 255)` |
| `--danger` | `oklch(.50 .18 28)` | `--danger-fg` | `oklch(.99 .01 255)` |
| `--info` | `oklch(.50 .10 235)` | `--info-fg` | `oklch(.99 .01 255)` |

### Consumo Tailwind / shadcn

O `design-tokens.css` expõe canais HSL ("space-separated") para o Tailwind. Os tripletos devem ser **gerados por conversão a partir dos OKLch acima**, nunca digitados à mão. Manter o padrão atual: escala `neutral-*`, `primary-*` (tinta), `selo-*` substituindo `brass-*`, e aliases semânticos (`--background`, `--foreground`, `--border`, `--ring`, etc.) apontando para a nova base quente.

---

## 3. Tipografia

- **Display:** `"Source Serif 4", Georgia, serif` — títulos, preços, números de destaque.
- **Body:** `"IBM Plex Sans"` — interface operacional.
- **Mono:** `"IBM Plex Mono"` — códigos, valores, cotações, selos.
- Escala: manter a escala `--text-*` existente (`clamp` no display, 13–14px no corpo operacional).
- Leading: display/H1 1.1–1.2; corpo 1.5–1.6; small ≤14px 1.5.
- Tracking (obrigatório): ALL CAPS `.06em–.1em`; display ≥32px `-.01em a -.02em`; corpo `0`; labels e botões `.02em`.
- Linha: corpo limitado a 50–75 caracteres (`max-width: 65ch`).
- 3 pesos: 400 ler / 550 ênfase / 600 anúncio. Sem "negrito sobre negrito".

---

## 4. Layout e conchas

- **LuxurySiteShell** (via `MinimalProviders`/`luxury-routes.ts`): vitrine, marketing, páginas de jogo — paredes de galeria, respiro, fios de 1px.
- **PanelShell**: vendedor, admin, observabilidade — denso, orientado a tabela, mesma base neutra.
- Grade: manter `--page-max: 80rem`, gutter padrão, escala de 4px de spacing.
- **Parede de vitrine**: grid de cartas com respiro uniforme; a carta (63/88) é o elemento dominante — nunca o chrome.
- **Densidade reequilibrada**: listas de comércio ganham espaço vertical nos destaques (preço, condição, estoque saltam pela ausência de ruído) e mantêm densidade nas tabelas operacionais.

---

## 5. Componentes

- **Carta**: frame 63/88 em superfície pura; fio de galeria (1px) + 1px de respiro; hover = elevação sutil (`--surface-2`), selo de condição ancorado ao canto com inset uniforme.
- **Selo de taxonomia** (única variação de cor por jogo): borda 1px + label mono uppercase; fio fino opcional de 2–3px no topo do cartão. Nunca um fundo.
- **Botões**: um CTA primário por ação/viewport (fundo `--selo`, texto `--on-selo`); demais entry points em ghost/texto. Cópia dos CTAs não repetida palavra por palavra.
- **Nav** (`GlobalHeader`, `GameMegaMenu`, `MobileLayout`): aplicar a correção de destaque ativo da auditoria (F11) — o jogo atual acende em `/{jogo}` e em `/{jogo}/cards`.
- **Tabelas de painel**: densas, linhas separadas por 1px de `--border`, valores em mono.

---

## 6. Estados e contraste

- **Hover**: mover a L do fundo ±0.06–0.12 (ou borda/sombra/posição); nunca escurecer o texto nem levá-lo a `--muted`. Botão sólido que inverte no hover troca fg+bg na mesma regra.
- **Focus**: todo foco navegável tem `:focus-visible` com `--ring` (3px, offset 2px).
- **Disabled**: único estado que reduz contraste.
- **Contraste mínimo**: texto 4.5:1; texto grande e ícones 3:1. Manter o opt-in `html[data-contrast="high"]`.

---

## 7. Skins por jogo → selos de 1px

**O shell nunca muda de cor por jogo.** Cada TCG contribui apenas um fio derivado do seu accent (hoje em `TCG_THEMES`, em `src/styles/tcg-theme.ts`):

| Jogo | Accent atual (HSL) | Selo |
|---|---|---|
| Magic | `221 83% 42%` | azul |
| Pokémon | `0 72% 50%` | vermelho |
| Yu-Gi-Oh! | `38 92% 50%` | âmbar |
| Lorcana | `270 55% 48%` | violeta |
| One Piece | `0 82% 52%` | vermelho |
| Flesh and Blood | `0 65% 38%` | vinho |
| Gundam | `0 75% 46%` | vermelho |
| Digimon | `24 95% 52%` | laranja |
| Dragon Ball | `355 85% 52%` | vermelho |
| Sorcery | `25 45% 38%` | âmbar escuro |
| Riftbound | `42 96% 48%` | dourado |

O selo do sistema (índigo `oklch(.44 .17 250)`) permanece para a identidade do marketplace; os fios acima são reservados à taxonomia de cada jogo. Jogos em hard-exit (ADR-016: SWU, Vanguard, Union Arena) **não têm landing nem selo** no ecossistema de produto.

**Noite de Leilão (contextual e opcional):** um único escuro canônico (`bg oklch(.20 .02 258)`, `surface oklch(.27 .022 258)`, `fg osso oklch(.93 .008 90)`, acento foil `oklch(.76 .10 82)`) aplicado **somente** em hubs de jogo, coleções e lançamentos. Fluxos transacionais — `/carrinho`, `/checkout`, `/pedidos`, listagem em `/vendedor` — permanecem **sempre** em Galeria clara.

---

## 8. Implementação no Judge (`runtime_console_v3`)

1. **`src/styles/design-tokens.css`** — retunar a base: `neutral-*` para os tons quentes de galeria (bg `oklch(.945 .004 90)`), `primary-*` continua tinta, `brass-*` → `selo-*` (índigo), aliases `--luxury-*` apontam para os novos tokens. Manter radius pequeno, sombras planas, escala tipográfica e spacing atuais.
2. **`src/styles/tcg-theme.ts`** — `TCG_THEMES` deixa de injetar superfície; expõe apenas a cor de `seal` derivada do accent. `LUXURY_JUDGE_SURFACES` fica reservado para a Noite de Leilão.
3. **Shells** (`luxury-routes.ts`, `LuxurySiteShell`, `PanelShell`, `GlobalHeader`): garantir cobertura da Galeria em vitrine/perfil/vendedor/judge e que a Noite de Leilão nunca alcance carrinho/checkout.
4. **Navegação** — aplicar `auditoria-navegacao-tcg.html`: canônicas em pt-BR, redirects (F04/F07/F08/F09), limpeza de links legados (F03/F12/F13), destaque ativo do menu (F11).
5. **Copy** — pt-BR em toda superfície; URLs canônicas já em pt-BR.

---

## 9. Aceitação (scorecard de implementação)

- [ ] `oklch` como única fonte de cor; nenhum hex novo em componentes.
- [ ] Um único acento por tela (`--selo`), aparecendo no máximo 2× por viewport.
- [ ] A vitrine em `/loja` não tem superfície colorida por jogo — apenas selos de 1px.
- [ ] Um CTA primário por ação; demais entry points ghost/texto.
- [ ] Contraste ≥4.5:1 (texto) e ≥3:1 (ícones) em todos os estados; `:focus-visible` com `--ring`.
- [ ] `/carrinho`, `/checkout`, `/pedidos` e listagem de vendedor permanecem claros (Galeria), nunca escuros.
- [ ] Navegação sem legados (`/marketplace/*`, `/store/*`, `/player/*`, `/leaderboard`) e com canônicas pt-BR.
- [ ] Copy pt-BR em toda superfície.

---

## Rastro

- `direcoes-paleta-nomes.html` — direção Galeria (9/10): tese, tokens e riscos (arte fraca deixa a loja vazia; densidade a reequilibrar).
- `brand-spec.md` — tipografia (serifa editorial + IBM Plex) e regras herdadas.
- `auditoria-navegacao-tcg.html` — correções de navegação aplicadas em conjunto.
- Código: `src/styles/design-tokens.css`, `src/styles/tcg-theme.ts`, `src/lib/luxury-routes.ts`.
