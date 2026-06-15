# tcghub-luxury

Site de apresentação premium para **Judge TCG** / tcghub.ai — separado do app core (`/judge`).

## Stack

- Vite 8 + React 19 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Framer Motion + GSAP (scroll storytelling)
- Lucide React (ícones, `strokeWidth={1.5}`)
- React Router

## Desenvolvimento

```bash
cd tcghub-luxury
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

Saída em `dist/`.

## Variáveis de ambiente

Crie `.env` (opcional):

```env
VITE_JUDGE_APP_URL=https://judgetcg.com.br/judge
VITE_PRICING_URL=https://judgetcg.com.br/pricing
```

## Deploy

### Vercel

1. Importe o repositório ou subpasta `tcghub-luxury`
2. Framework: **Vite**
3. Build: `npm run build`
4. Output: `dist`
5. Defina as variáveis `VITE_*` acima

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Estrutura

- `/` — Landing (Hero, Features, Showcase, TCG Gallery, Testimonials, Pricing, CTA)
- `/features` — Deep-dive com scroll pin (GSAP)
- `/about` — Página editorial

## Design

Paleta escura (`luxury-*`), acentos dourado/prata, glassmorphism moderado, animações suaves.
Sem emojis, sem neon, sem gradientes arco-íris.

## Imagens

Substitua `public/images/hero-tournament.svg` por fotos reais de torneio (`hero-tournament.jpg`) para produção final.
