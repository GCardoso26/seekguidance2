---
name: JudgeTCG
description: Galeria — parede neutra; a carta é a cor; um selo índigo.
colors:
  bg: "oklch(0.945 0.004 90)"
  surface: "oklch(0.98 0.003 90)"
  surface-2: "oklch(1 0.002 90)"
  fg: "oklch(0.24 0.012 255)"
  muted-ink: "oklch(0.44 0.018 250)"
  border: "oklch(0.88 0.006 90)"
  selo: "oklch(0.44 0.17 250)"
  on-selo: "oklch(0.985 0.006 240)"
  selo-hover: "oklch(0.38 0.16 250)"
  selo-press: "oklch(0.34 0.15 250)"
  disabled-bg: "oklch(0.92 0.005 90)"
  disabled-fg: "oklch(0.7 0.012 250)"
  success: "oklch(0.48 0.13 155)"
  warning: "oklch(0.54 0.14 75)"
  danger: "oklch(0.50 0.18 28)"
  info: "oklch(0.50 0.10 235)"
  auction-bg: "oklch(0.20 0.02 258)"
  auction-surface: "oklch(0.27 0.022 258)"
  auction-fg: "oklch(0.93 0.008 90)"
  auction-foil: "oklch(0.76 0.10 82)"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.75rem, 1.55rem + 0.9vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.5rem, 1.35rem + 0.7vw, 1.875rem)"
    fontWeight: 550
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 550
    lineHeight: 1.3
    letterSpacing: "0"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.06em"
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.625rem"
  "2xl": "0.75rem"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
  "12": "3rem"
  "16": "4rem"
components:
  button-primary:
    backgroundColor: "{colors.selo}"
    textColor: "{colors.on-selo}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.selo-hover}"
    textColor: "{colors.on-selo}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  card-gallery:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.xl}"
    padding: "1.25rem"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.75rem"
    height: "2.25rem"
---

# Design System: JudgeTCG — Galeria

## Overview

**Creative North Star: "Galeria — a carta é a cor"**

Galeria trata a carta como objeto de museu: a interface é neutra e quase desaparece; a única cor em cena vem da arte do colecionável. É a resposta anti-cor à fragmentação de skins neon por TCG e ao vão do “editorial de colecionador” que nenhum incumbente ocupa.

Três regras governam tudo: (1) **concha neutra** — paredes de galeria, quase monocromáticas, nunca uma superfície escura/neon por jogo; (2) **arte como fonte de cor** — o colecionável dá a cor; a UI apenas enquadra; (3) **um selo índigo** — acento único do sistema; por jogo, apenas um fio de 1px de taxonomia.

O gesto único do sistema é o **fio de galeria** — 1px de borda com 1px de respiro interno no enquadramento. Um só floreio, reutilizado em vitrine, selos e destaques. **Noite de Leilão** é camada contextual opcional (hubs, coleções, lançamentos); fluxos transacionais permanecem sempre em Galeria clara. Motion segue a allowlist React Bits: o movimento suspende a carta, nunca vira o assunto.

**Key Characteristics:**
- Parede quente neutra (`oklch` em hue ~90); tinta azulada no texto
- Um acento índigo (`--selo`) — CTA, foco e micro-selo; nunca lavagem de superfície
- Tipografia serifa editorial (Source Serif 4) + IBM Plex Sans/Mono
- Elevação plana: fio de 1px > sombra; sombras só ambientais e fracas
- Selos taxonômicos 1px por TCG; shell nunca muda de cor por jogo
- Acessibilidade obrigatória: contraste ≥4.5:1, `:focus-visible`, opt-in `data-contrast="high"`

## Colors

Paleta quase monocromática de galeria; o índigo do selo é micro-acento, não o tom da interface.

### Primary
- **Selo Índigo** (`oklch(0.44 0.17 250)`): único acento do marketplace — CTA sólido, anel de foco, estados selecionados via `--selo-soft`. Hover/press movem L para `selo-hover` / `selo-press`.
- **On-selo** (`oklch(0.985 0.006 240)`): texto/ícone sobre o CTA.

### Secondary
Omitido como segundo acento de marca. A “tinta” (`--fg` / escala `primary-*` HSL) é tipográfica, não lavagem.

### Tertiary
**Fios taxonômicos por TCG** (não acento de sistema): cada jogo contribui só `--tcg-seal` derivado do accent HSL em `tcg-theme.ts` — Magic azul, Pokémon vermelho, Yu-Gi-Oh! âmbar, Lorcana violeta, etc. Hard-exit (ADR-016: SWU, Vanguard, Union Arena) sem landing nem selo de vitrine.

### Neutral
- **Parede** (`oklch(0.945 0.004 90)`): fundo canônico da Galeria clara
- **Superfície / Superfície-2**: cartões e hover elevado
- **Tinta** (`oklch(0.24 0.012 255)`): texto primário
- **Tinta secundária** (`oklch(0.44 0.018 250)`): muted ink (≥4.5:1 sobre bg)
- **Fio** (`oklch(0.88 0.006 90)`): borda 1px — agrupa, não sombreia
- **Semânticos**: success / warning / danger / info (oklch canônicos; canais HSL derivados no CSS)
- **Noite de Leilão** (contextual): `auction-bg` / `auction-surface` / `auction-fg` / `auction-foil` — só via `data-shell="auction"`

**The One Seal Rule.** O acento `--selo` aparece no máximo ~2× por viewport (CTA + foco/selo); nunca como fill de parede ou wash por jogo.

**The Gallery Wire Rule.** Cor por TCG = fio de 1px (topo de cartão / label mono), nunca fundo colorido no shell.

## Typography

**Display Font:** Source Serif 4 (Georgia)
**Body Font:** IBM Plex Sans (system-ui)
**Label/Mono Font:** IBM Plex Mono (ui-monospace)

**Character:** Serifa editorial para títulos, preços e números de destaque; sans operacional para UI; mono para códigos, cotações e selos uppercase.

### Hierarchy
- **Display** (400, `clamp` display-m→xl, leading 1.15, tracking −0.01em a −0.02em ≥32px): heróis e preços.
- **Headline** (550–600, `--text-h1`/`h2`, leading 1.1–1.2): seções.
- **Title** (550, `--text-h4`/`h5`): cartões e painéis.
- **Body** (400, 0.9375rem / 15px, leading 1.5–1.6, máx. ~65ch): leitura operacional.
- **Label** (400, 0.75–0.8125rem, mono, ALL CAPS tracking `.06em–.1em`): selos e overlines.
- Pesos: 400 ler / 550 ênfase / 600 anúncio. Sem “negrito sobre negrito”.

**The Three-Weight Rule.** Só 400 / 550 / 600. Tracking obrigatório em ALL CAPS e display grande.

## Layout

Duas conchas, mesma base neutra: **Luxury/Portal** (vitrine, marketing, hubs) com respiro e parede de galeria; **PanelShell** (vendedor, admin, ops) denso e tabular. Container `--page-max: 80rem`, gutter `--page-gutter: 1rem`, ritmo de spacing em escala 4 (`--space-1`…`--space-16`). Parede de vitrine: grade de cartas com respiro uniforme; a carta (proporção 63/88) domina o chrome. Rotas travadas em Galeria clara: `/carrinho`, `/checkout`, `/pedidos`, `/vendedor`, `/loja/busca` (`GALLERY_LOCKED_PREFIXES`). Copy e canônicas de URL em pt-BR.

## Elevation & Depth

Sistema **plano por padrão**: profundidade via tonalidade (`surface` → `surface-2`) e fio de 1px, não via sombra estrutural. Sombras existem mas são ambientais e quase invisíveis.

### Shadow Vocabulary
- **xs** (`0 1px 0 hsl(214 15% 12% / 0.03)`): botão sólido em repouso
- **sm** (`0 1px 2px … / 0.04`): inputs / controles
- **md–xl**: elevações raras; opacidade ≤0.07

**The Flat-By-Default Rule.** Superfícies em repouso são planas. Sombra responde a estado (hover/elevação), nunca define a hierarquia da página.

## Shapes

Cantos **pequenos e consistentes**: controles e botões em `rounded-lg` (0.5rem); cartões de universo em `rounded-xl` (0.625rem). Frame de carta: `--gallery-frame` + `--gallery-pad: 1px`. Sem pill clusters como linguagem de marca; `radius-full` só onde o controle exige (avatars, badges pontuais).

**The Gallery Frame Rule.** Enquadramento = 1px de fio + 1px de respiro. Esse é o único floreio geométrico do sistema.

## Components

### Buttons
- **Shape:** `rounded-lg` (0.5rem); altura default 2.25rem (`h-9`)
- **Primary:** fundo `--selo` / `primary` → texto `--on-selo`; um CTA primário por ação/viewport
- **Hover / Focus:** `selo-hover` / `primary/90`; `:focus-visible` 3px `ring` offset 2px; `active:scale-[0.98]`
- **Ghost / Outline:** entry points secundários; outline = borda `--border` em superfície

### Chips
- **Style:** selo de taxonomia — borda 1px + label mono uppercase; fio 1px no topo do cartão de universo
- **State:** selecionado via `--selo-soft`, nunca fill de jogo

### Cards / Containers
- **Corner Style:** `rounded-xl` na vitrine de jogos; frames de carta com gallery-frame
- **Background:** `--surface` / `card`; hover → `--surface-2`
- **Shadow Strategy:** plana; GlareHover permitido no frame neutro (allowlist)
- **Border:** 1px `--border`
- **Internal Padding:** ~`p-5` (1.25rem) nos cards de universo

### Inputs / Fields
- **Style:** `h-9`, `rounded-lg`, borda `input`, fundo `card`, `shadow-xs`
- **Focus:** classe `focus-ring` / outline global Galeria
- **Error / Disabled:** danger semântico; disabled = único estado que reduz contraste

### Navigation
- **Style:** `GlobalHeader` + mega-menu / mobile — destaque ativo do jogo em `/{jogo}` e `/{jogo}/cards`; chrome checkout distinto; sem Dock/GooeyNav da avoid-list React Bits

### Carta (signature)
Frame 63/88 em superfície pura; fio de galeria; selo de condição no canto com inset uniforme; motion = suspensão leve (AnimatedContent, GlareHover) — um instrumento por CTA (Magnet **ou** Spotlight, não ambos).

## Do's and Don'ts

### Do:
- **Do** tratar `oklch()` em `design-tokens.css` como fonte de cor; canais HSL são derivados para Tailwind/shadcn.
- **Do** manter um CTA `--selo` por ação e entry points ghost/texto no restante.
- **Do** usar selo taxonômico 1px por jogo; shell permanece Galeria.
- **Do** travar `/carrinho`, `/checkout`, `/pedidos`, `/vendedor` (e busca de loja) em Galeria clara.
- **Do** respeitar a allowlist React Bits e `prefers-reduced-motion` (transitions → 0ms).
- **Do** garantir contraste ≥4.5:1 (texto) e `:focus-visible` com ring 3px / offset 2px.

### Don't:
- **Don't** lavar superfície com cor de TCG, aurora multicor ou wash `primary` atrás da grade.
- **Don't** aplicar Noite de Leilão / WebGL em fluxos transacionais ou KPIs de dashboard claro.
- **Don't** empilhar Magnet + Spotlight no mesmo CTA.
- **Don't** inventar hex novos em componentes; não reintroduzir `brass-*` como acento (aliases só de compat).
- **Don't** mudar o shell de cor por jogo nem criar landing para hard-exit (ADR-016).
