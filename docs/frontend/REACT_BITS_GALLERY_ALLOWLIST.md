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

| Superfície | Uso recomendado | Jamais | Status wiring |
|------------|-----------------|--------|---------------|
| Vitrine `/loja` | SplitText*, GlareHover, CountUp, SpotlightCard, Noise | Background atrás da grade | wired |
| Coleção `/colecao` | FadeContent, CountUp, Iridescence (foil) | OrbitImages em excesso; glass | wired |
| Eventos `/search/torneios` (+ redirect `/torneio`) | RotatingText, CountUp vagas, FadeContent | Glitch; fundos escuros no checkout | wired |
| Detalhe `/search/torneios/[id]` | CountUp vagas, Magnet CTA, GradualBlur regras | Soft Aurora / WebGL | wired |
| Hubs `/[jogo]` (Noite) | SoftAurora (1), CountUp | Hyperspeed, Galaxy, Balatro; BorderGlow/MagicBento adiados (layout) | wired |
| `/carrinho` `/checkout` `/perfil/compras` | Counter qty + Fade | **Tudo o mais** | wired |
| Painéis `/vendedor`, judge, admin | Fade + CountUp KPIs | Backgrounds / WebGL | wired |

\* SplitText/DotGrid/Masonry/ScrollStack/MagicBento/LightRays: instalados; SplitText/DotGrid exigem GSAP Club; Masonry/ScrollStack/MagicBento adiados (risco de layout).


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
10. ESLint ignora `src/components/react-bits/**` (upstream owned copy, espelha `luxury/`) — lint rigoroso fica nos wrappers de rota (`LojaHeroGallery`, etc.).

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

Os componentes **já estão** em `src/components/react-bits/` no repo. Só rode o CLI se for **adicionar** uma peça nova da allowlist.

**PowerShell (Windows):** não use `\` no fim da linha — o shadcn interpreta `\` como nome de item e falha com `…/new-york/\.json`. Use uma linha só, ou `` ` `` para continuar.

```powershell
cd frontend/runtime_console_v3

# Núcleo (+ FadeContent auxiliar) — uma linha
npx shadcn@latest add @react-bits/Noise-TS-TW @react-bits/Grainient-TS-TW @react-bits/DotGrid-TS-TW @react-bits/SplitText-TS-TW @react-bits/CountUp-TS-TW @react-bits/BlurText-TS-TW @react-bits/ShinyText-TS-TW @react-bits/AnimatedContent-TS-TW @react-bits/GlareHover-TS-TW @react-bits/SpotlightCard-TS-TW @react-bits/Magnet-TS-TW @react-bits/GradualBlur-TS-TW @react-bits/AnimatedList-TS-TW @react-bits/Masonry-TS-TW @react-bits/Carousel-TS-TW @react-bits/Counter-TS-TW @react-bits/FadeContent-TS-TW

# Contextuais — uma linha
npx shadcn@latest add @react-bits/SoftAurora-TS-TW @react-bits/Aurora-TS-TW @react-bits/LightRays-TS-TW @react-bits/Iridescence-TS-TW @react-bits/Threads-TS-TW @react-bits/RotatingText-TS-TW @react-bits/CircularText-TS-TW @react-bits/OrbitImages-TS-TW @react-bits/ScrollStack-TS-TW @react-bits/BorderGlow-TS-TW @react-bits/MagicBento-TS-TW
```

**bash / zsh** (continuações com `\` ok):

```bash
cd frontend/runtime_console_v3
npx shadcn@latest add @react-bits/Noise-TS-TW @react-bits/Grainient-TS-TW @react-bits/DotGrid-TS-TW \
  @react-bits/SplitText-TS-TW @react-bits/CountUp-TS-TW @react-bits/BlurText-TS-TW @react-bits/ShinyText-TS-TW \
  @react-bits/AnimatedContent-TS-TW @react-bits/GlareHover-TS-TW @react-bits/SpotlightCard-TS-TW \
  @react-bits/Magnet-TS-TW @react-bits/GradualBlur-TS-TW \
  @react-bits/AnimatedList-TS-TW @react-bits/Masonry-TS-TW @react-bits/Carousel-TS-TW @react-bits/Counter-TS-TW \
  @react-bits/FadeContent-TS-TW
npx shadcn@latest add @react-bits/SoftAurora-TS-TW @react-bits/Aurora-TS-TW @react-bits/LightRays-TS-TW \
  @react-bits/Iridescence-TS-TW @react-bits/Threads-TS-TW \
  @react-bits/RotatingText-TS-TW @react-bits/CircularText-TS-TW \
  @react-bits/OrbitImages-TS-TW @react-bits/ScrollStack-TS-TW @react-bits/BorderGlow-TS-TW @react-bits/MagicBento-TS-TW
```

Depois: mover para `src/components/react-bits/` se o CLI gravar em `src/components/`. Registry em `components.json`: `"@react-bits": "https://reactbits.dev/r/{name}.json"`.

## Relaciona

- [design.md](../../design.md)
- [design-tokens.css](../../frontend/runtime_console_v3/src/styles/design-tokens.css)
- Regra Cursor: `.cursor/rules/react-bits-gallery.mdc`