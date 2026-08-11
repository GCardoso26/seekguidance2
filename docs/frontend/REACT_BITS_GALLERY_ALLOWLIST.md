# React Bits × Galeria — Allowlist

> **Validação:** 11/08/2026 · Catálogo React Bits (MIT, 160+ · 4 variantes JS/TS × CSS/TW)  
> **Tese:** [design.md](../../design.md) — a parede fica neutra; o movimento suspende a carta, nunca vira o assunto.  
> **Variante canônica:** `*-TS-TW` · instalação por componente (`npx shadcn@latest add @react-bits/<Nome>-TS-TW`).

## Critérios (crivos)

1. **Um acento por tela** — sem gradientes multicor / auroras vibrantes / wash de roxo; efeitos só em `--selo` atenuado ou monocromia da parede.
2. **Transações sempre claras** — WebGL, partículas e cenas escuras só na camada **Noite de Leilão** (hubs, coleções, lançamentos). `/carrinho`, `/checkout`, `/perfil/pedidos` e painéis **nunca** escurecem.
3. **Um floreio só** — gesto do sistema = fio de galeria (1px). Animação = suspensão leve (reveal, número, reflexo), não espetáculo.

## Núcleo · adotar (15)

Dinamismo quieto na Galeria clara. Casa fixa no ecossistema.

| # | Componente | Categoria | Onde |
|---|------------|-----------|------|
| 1 | Noise (Grainient) | backgrounds | Hero `/loja` e hubs de jogo; opcional Noite de Leilão |
| 2 | DotGrid | backgrounds | Faixa de CTA e rodapés — `--border`, opacidade baixa |
| 3 | SplitText | texto | Hero `/loja`, títulos de hubs e landing de jogo |
| 4 | CountUp | texto | Preços, valor da coleção, vagas em `/search/torneios`, KPIs |
| 5 | BlurText | texto | Títulos de seção e nomes de jogo |
| 6 | ShinyText | texto | Preço foil / selo de condição — máx. 1–2 / viewport |
| 7 | AnimatedContent | interação | Base de reveals de grade (cartas, listagens) |
| 8 | GlareHover | interação | Hover das cartas na vitrine |
| 9 | SpotlightCard | interação | Destaques / hero |
| 10 | Magnet | interação | CTA `--selo` (“Comprar”, “Garantir vaga”) — um por ação |
| 11 | GradualBlur | interação | Descrições longas, regras de evento, artigos |
| 12 | AnimatedList | componentes | Próximos eventos `/search/torneios`, watchlist, feeds |
| 13 | Masonry | componentes | `/colecao` e busca `/loja` (+ FadeContent) |
| 14 | Carousel | componentes | Lançamentos `/loja` e faixas hype por jogo |
| 15 | Counter | componentes | Qty carrinho, vagas evento, estoque seller |

## Contextuais · Noite de Leilão (10)

Só hubs / coleções / lançamentos / leilão futuro. Índigo atenuado ou cor única — nunca neon default.

| # | Componente | Categoria | Onde |
|---|------------|-----------|------|
| 1 | SoftAurora | backgrounds | Hero hub de jogo e coleção (`data-shell` Noite) |
| 2 | LightRays | backgrounds | Header lançamento / leilão — monocromático |
| 3 | Iridescence | backgrounds | Micro-fundo foil no detalhe — nunca lavagem de página |
| 4 | Threads | backgrounds | Divisórias em hubs — `--border` sobre escuro |
| 5 | RotatingText | texto | Formatos no hero de eventos / landing por jogo |
| 6 | CircularText | texto | Selo “Leilão ao vivo” — um / viewport |
| 7 | OrbitImages | componentes | Hero coleção / lançamento |
| 8 | ScrollStack | componentes | Últimas adições da coleção |
| 9 | BorderGlow | componentes | Lote do dia / destaque — um / viewport |
| 10 | MagicBento | componentes | Hubs de jogo; painel seller **só versão discreta** |

## Evitar (16)

| Família | Motivo |
|---------|--------|
| GlitchText / Scrambled / ASCII | Colide com serifa editorial |
| GradientText | Viola um acento por tela |
| Cursors (Blob, Splash, Ghost, Crosshair, Target) | Roubam foco da arte |
| PixelTrail / ClickSpark | Barulho no clique |
| LaserFlow / Ribbons / Strands / MagnetLines | Espetáculo, não suspensão |
| StickerPeel / Peel / BounceCards | Lúdico demais |
| Dock / GooeyNav / BubbleMenu | Compete com GlobalHeader |
| GlassSurface / GlassIcons / FluidGlass | Nega parede de papel |
| StarBorder | Preferir BorderGlow contido |
| PixelTransition / MetallicPaint / Cubes | Estética “gamer” |
| Hyperspeed / Galaxy / PrismaticBurst | Fora da galeria |
| LiquidChrome / LiquidEther / Ferrofluid | Chrome vira o assunto |
| Balatro / Plasma / EvilEye | Cassino / shader de jogo |
| MetaBalls / BlobCursor | Orgânico demais para o grid |
| CircularGallery / DomeGallery / ModelViewer | 3D caro, baixo retorno |
| TextPressure / VariableProximity / TrueFocus | Tipografia que deforma |

## Mapa de colocação (rotas atualizadas)

| Superfície | Uso recomendado | Jamais |
|------------|-----------------|--------|
| Vitrine `/loja` | SplitText, GlareHover, CountUp, SpotlightCard, ShinyText (foil) | Background animado atrás da grade; cursors |
| Coleção `/colecao` | Masonry + FadeContent, ScrollStack, Iridescence (foil) | OrbitImages em excesso; glass |
| Eventos `/search/torneios` (+ redirect `/torneio`) | AnimatedList, RotatingText (hub), CountUp vagas | Glitch; fundos escuros no fluxo de inscrição/checkout de ingresso |
| Detalhe evento `/search/torneios/[id]` | CountUp vagas, Magnet no CTA, GradualBlur em regras | Soft Aurora / WebGL |
| Hubs `/[jogo]` (Noite de Leilão) | SoftAurora, LightRays, MagicBento, BorderGlow | Hyperspeed, Galaxy, Balatro, prismas |
| Leilão (futuro) | CountUp lances, CircularText, BorderGlow | StarBorder, LiquidChrome, cursors |
| `/carrinho` `/checkout` `/perfil/pedidos` | Só fade de estado + Counter qty | **Tudo o mais** |
| Painéis `/vendedor/*`, judge, admin | AnimatedList, FadeContent, CountUp KPIs | Backgrounds animados / WebGL |

## Guardrails de implementação

1. Instalação **por componente** — nunca o monólito.
2. Código sob `frontend/runtime_console_v3/src/components/react-bits/` (owned copy).
3. Dependências: preferir `framer-motion` 11 já no repo; avaliar `motion` v12 **só por peça**.
4. Todo efeito: `"use client"` + gate `mounted` para WebGL/canvas.
5. Respeitar `prefers-reduced-motion` (obrigatório).
6. **Um** background animado por rota; priorizar LCP do hero.
7. Cores via tokens (`--selo`, `--border`, neutros) — sem hex novo; selo ≤ 2× / viewport.
8. Hover: L ±0.06–0.12; `:focus-visible` mantém `--ring`.
9. Não quebrar `data-testid`; cobrir fluxos animados no Playwright visual.

## Instalados (owned copy)

Pasta: `frontend/runtime_console_v3/src/components/react-bits/`

**Núcleo:** Noise, Grainient, DotGrid, SplitText, CountUp, BlurText, ShinyText, AnimatedContent, GlareHover, SpotlightCard, Magnet, GradualBlur, AnimatedList, Masonry, Carousel, Counter, FadeContent  

**Contextuais:** SoftAurora, Aurora, LightRays, Iridescence, Threads, RotatingText, CircularText, OrbitImages, ScrollStack, BorderGlow, MagicBento

Import exemplo:

```ts
import SplitText from "@/components/react-bits/SplitText";
import GlareHover from "@/components/react-bits/GlareHover";
```

## Instalação (allowlist)

```bash
cd frontend/runtime_console_v3
# Núcleo (+ FadeContent auxiliar)
npx shadcn@latest add @react-bits/Noise-TS-TW @react-bits/Grainient-TS-TW @react-bits/DotGrid-TS-TW \
  @react-bits/SplitText-TS-TW @react-bits/CountUp-TS-TW @react-bits/BlurText-TS-TW @react-bits/ShinyText-TS-TW \
  @react-bits/AnimatedContent-TS-TW @react-bits/GlareHover-TS-TW @react-bits/SpotlightCard-TS-TW \
  @react-bits/Magnet-TS-TW @react-bits/GradualBlur-TS-TW \
  @react-bits/AnimatedList-TS-TW @react-bits/Masonry-TS-TW @react-bits/Carousel-TS-TW @react-bits/Counter-TS-TW \
  @react-bits/FadeContent-TS-TW
# Contextuais
npx shadcn@latest add @react-bits/SoftAurora-TS-TW @react-bits/Aurora-TS-TW @react-bits/LightRays-TS-TW \
  @react-bits/Iridescence-TS-TW @react-bits/Threads-TS-TW \
  @react-bits/RotatingText-TS-TW @react-bits/CircularText-TS-TW \
  @react-bits/OrbitImages-TS-TW @react-bits/ScrollStack-TS-TW @react-bits/BorderGlow-TS-TW @react-bits/MagicBento-TS-TW
# Em seguida mover para src/components/react-bits/ se o CLI gravar em src/components/
```

## Relaciona

- [design.md](../../design.md)
- [design-tokens.css](../../frontend/runtime_console_v3/src/styles/design-tokens.css)
- Regra Cursor: `.cursor/rules/react-bits-gallery.mdc`