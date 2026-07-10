# JudgeTCG Design System v3 (Premium)

**Versão:** 3.0  
**Escopo:** Frontend (`runtime_console_v3`)  
**Tema padrão:** Light · Dark · High Contrast (`data-contrast="high"`)

## Princípios

1. **Consistência sobre criatividade**
2. **Light-first**, contraste WCAG AA
3. **Semântica sobre hex** — nunca cores soltas em código novo
4. **Tokens únicos** — `design-tokens.css` é a fonte de verdade
5. **Rebrand-ready** — `src/lib/brand.ts`

## Tipografia (clamp)

`text-display-xl` · `display-l` · `display-m` · `h1`–`h5` · `body-xl` · `body-lg` · `body` · `small` · `caption` · `label` · `hint` · `overline` · `button` · `table`

## Cores

Scales: Neutral, Primary, Success, Warning, Danger, Info (50–900 onde aplicável).  
Aliases `luxury-*` **deprecated** — mapeiam para semânticos.

## Motion

`src/lib/motion.ts` — Framer variants 150–250ms · `prefers-reduced-motion` zera transitions.

## Enforcement

```bash
npm run ds:audit
```

## Brand

```ts
import { brand, brandTitle } from "@/lib/brand";
```

Env: `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_BRAND_LOGO`, `NEXT_PUBLIC_BRAND_THEME`, etc.
