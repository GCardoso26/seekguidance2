# React Bits × Galeria — Allowlist

> **Revalidação Impeccable:** 11/08/2026 · Catálogo React Bits (MIT, 160+ · 4 variantes JS/TS × CSS/TW)  
> **Tese:** [design.md](../../design.md) / [DESIGN.md](../../DESIGN.md) — a parede fica neutra; o movimento suspende a carta, nunca vira o assunto.  
> **Variante canônica:** `*-TS-TW` · instalação por componente (`npx shadcn@latest add @react-bits/<Nome>-TS-TW`).

## Veredito da revalidação

| Camada | Veredito |
|--------|----------|
| Curadoria (15 / 10 / 16) | **Mantida** — crivos batem a tese Galeria; avoid-list é política, não gosto. |
| Wiring (código) | **Parcial** — havia drift para “showcase React Bits”; must-fixes aplicados nesta passagem. |
| Detector (`detect.mjs`) | Limpo (exit 0) nos wrappers wired. |

**Must-fixes desta passagem:** cards `/loja` sem lavagem de cor por jogo; hero `/loja` sem wash `primary` e sem Magnet+Spotlight empilhados; SoftAurora só sem arte/carousel e com índigo atenuado; Iridescence **fora** do KPI da coleção (WebGL não decora dashboard claro).

## Critérios (crivos)

1. **Um acento por tela** — sem gradientes multicor / auroras vibrantes / wash de roxo; efeitos só em `--selo` atenuado ou monocromia da parede. Cor por jogo = **selo taxonômico 1px**, nunca fill de superfície.
2. **Transações sempre claras** — WebGL, partículas e cenas escuras só na camada **Noite de Leilão** (hubs, coleções noturnas, lançamentos). `/carrinho`, `/checkout`, `/perfil/pedidos` e painéis **nunca** escurecem.
3. **Um floreio só** — gesto do sistema = fio de galeria (1px). Animação = suspensão leve (reveal, número, reflexo), não espetáculo. **Um** instrumento de interação por CTA (Magnet **ou** Spotlight, não ambos).

## Núcleo · adotar (15)

Dinamismo quieto na Galeria clara. Casa fixa no ecossistema.

| # | Componente | Categoria | Onde | Status |
|---|------------|-----------|------|--------|
| 1 | Noise (Grainient) | backgrounds | Hero `/loja`; opcional Noite | **wired** `/loja` |
| 2 | DotGrid | backgrounds | Faixa CTA / rodapés — `--border` | **blocked** — GSAP Club (`InertiaPlugin`) |
| 3 | SplitText | texto | Hero `/loja`, hubs | **blocked** — GSAP Club; **proxy:** BlurText |
| 4 | CountUp | texto | Preços, coleção, vagas `/search/torneios`, KPIs | **wired** |
| 5 | BlurText | texto | Títulos de seção / hero (proxy SplitText) | **wired** |
| 6 | ShinyText | texto | Preço foil (PDP) / selo Foil — máx. 1–2 / viewport | **wired** via `FoilShinyText` |
| 7 | AnimatedContent | interação | Reveals de grade | **wired** `/loja` cards |
| 8 | GlareHover | interação | Hover carta/universo — frame **neutro** | **wired** `/loja` |
| 9 | SpotlightCard | interação | Destaque único (não empilhar com Magnet) | **installed** — usar 1× / viewport |
| 10 | Magnet | interação | CTA `--selo` — um por ação | **wired** `/loja`, evento detail |
| 11 | GradualBlur | interação | Regras / textos longos | **wired** detalhe evento |
| 12 | AnimatedList | componentes | Eventos / feeds | **deferred** — API string-only; usar FadeContent |
| 13 | Masonry | componentes | `/colecao` e busca `/loja` | **deferred** — risco de layout |
| 14 | Carousel | componentes | Lançamentos `/loja` | **deferred** |
| 15 | Counter | componentes | Qty carrinho, vagas, estoque | **wired** carrinho |

**Auxiliar (não conta nos 15):** FadeContent — **wired** via `GalleryMotion` em listagens/painéis.

## Contextuais · Noite de Leilão (10)

Só hubs / coleções noturnas / lançamentos / leilão futuro. Índigo atenuado ou cor única — nunca neon default.

| # | Componente | Categoria | Onde | Status |
|---|------------|-----------|------|--------|
| 1 | SoftAurora | backgrounds | Hero hub **sem** arte/carousel full-bleed | **wired** `/[jogo]` (gated) |
| 2 | LightRays | backgrounds | Header leilão / lançamento | **deferred** |
| 3 | Iridescence | backgrounds | Micro-fundo foil em **detalhe de carta** — nunca KPI/dashboard claro | **installed** — não wired em `/colecao` hub |
| 4 | Threads | backgrounds | Divisórias hubs sobre escuro | **deferred** |
| 5 | RotatingText | texto | Formatos no hub de eventos (aceito em Galeria clara do hub) | **wired** `/search/torneios` |
| 6 | CircularText | texto | Selo “Leilão ao vivo” | **deferred** — leilão futuro |
| 7 | OrbitImages | componentes | Hero coleção / lançamento Noite | **deferred** |
| 8 | ScrollStack | componentes | Últimas adições coleção | **deferred** |
| 9 | BorderGlow | componentes | Lote do dia — um / viewport | **deferred** — API força sombra escura |
| 10 | MagicBento | componentes | Hubs; seller só versão discreta | **deferred** |

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

## Mapa de colocação

| Superfície | Uso recomendado | Jamais | Status |
|------------|-----------------|--------|--------|
| Vitrine `/loja` | BlurText/Noise, GlareHover (frame neutro), CountUp, Magnet (1) | Wash de cor por jogo; bg animado atrás da grade | **aligned** |
| Coleção `/colecao` | Fade + CountUp; first fold 4 KPIs; mais métricas/tools em disclosure | Iridescence em KPI; OrbitImages excesso | **aligned** |
| Eventos `/search/torneios` (+ redirect `/torneio`) | RotatingText, CountUp vagas, Fade | Glitch; fundos escuros no checkout | **aligned** |
| Detalhe `/search/torneios/[id]` | CountUp, Magnet, GradualBlur regras | SoftAurora / WebGL | **aligned** |
| Hubs `/[jogo]` (Noite) | SoftAurora **só** sem arte dominante; CountUp | Empilhar aurora + banner; Hyperspeed | **aligned** |
| `/carrinho` `/checkout` `/perfil/compras` | Counter qty + Fade | **Tudo o mais** | **aligned** |
| Painéis `/vendedor`, judge, admin | Fade + CountUp KPIs | Backgrounds / WebGL | **aligned** |

## Guardrails de implementação

1. Instalação **por componente** — nunca o monólito.
2. Código sob `frontend/runtime_console_v3/src/components/react-bits/` (owned copy). Wrappers de rota em `components/loja|games|gallery|…`.
3. Dependências: `framer-motion` 11 + `motion` 12 por peça; gsap free ok; **Club plugins não assumidos**.
4. Todo efeito: `"use client"` + gate `mounted` / `prefers-reduced-motion` para WebGL/canvas.
5. **Um** background animado por rota; se há arte/carousel full-bleed, **não** empilhar SoftAurora.
6. Cores via tokens; wrappers de rota sem lavagem hex de jogo. SoftAurora/WebGL podem exigir hex — só paleta Noite atenuada, documentada.
7. Selo ≤ 2× / viewport; hover L ±0.06–0.12; `:focus-visible` com `--ring`.
8. Não quebrar `data-testid`.
9. ESLint ignora `src/components/react-bits/**` (como `luxury/`).
10. Status no mapa: `aligned` | `partial` | `deferred` | `blocked` — nunca “wired” para peça não usada na rota.

## Instalados (owned copy)

Pasta: `frontend/runtime_console_v3/src/components/react-bits/`

**Núcleo:** Noise, Grainient, DotGrid, SplitText, CountUp, BlurText, ShinyText, AnimatedContent, GlareHover, SpotlightCard, Magnet, GradualBlur, AnimatedList, Masonry, Carousel, Counter, FadeContent  

**Contextuais:** SoftAurora, Aurora, LightRays, Iridescence, Threads, RotatingText, CircularText, OrbitImages, ScrollStack, BorderGlow, MagicBento

```ts
import GlareHover from "@/components/react-bits/GlareHover";
import { GalleryCountUp, GalleryFade } from "@/components/gallery/GalleryMotion";
```

## Instalação (allowlist)

Os componentes **já estão** em `src/components/react-bits/`. Só rode o CLI para peça **nova** da allowlist.

**PowerShell:** não use `\` no fim da linha (vira item `\` → `…/new-york/\.json`). Uma linha só, ou `` ` ``.

```powershell
cd frontend/runtime_console_v3
npx shadcn@latest add @react-bits/Noise-TS-TW @react-bits/CountUp-TS-TW @react-bits/BlurText-TS-TW
```

Registry: `"@react-bits": "https://reactbits.dev/r/{name}.json"`.

## Relaciona

- [design.md](../../design.md) · [DESIGN.md](../../DESIGN.md)
- [design-tokens.css](../../frontend/runtime_console_v3/src/styles/design-tokens.css)
- Regra Cursor: `.cursor/rules/react-bits-gallery.mdc`
- Critique slug: `docs-frontend-react-bits-gallery-allowlist-md`
