# JudgeTCG Design System v2

**Versão:** 2.0  
**Escopo:** Frontend (`runtime_console_v3`)  
**Tema padrão:** Light  
**Dark mode:** Opcional (toggle no header)

## Princípios

1. **Consistência sobre criatividade** — um produto, uma linguagem visual.
2. **Light-first** — superfícies claras, contraste WCAG AA, leitura confortável.
3. **Premium sem peso** — sombras suaves, espaçamento generoso, sem preto absoluto.
4. **Semântica sobre hex** — tokens HSL via CSS variables, nunca cores soltas em componentes novos.

## Arquitetura de tokens

```
src/styles/design-tokens.css   ← fonte de verdade (HSL)
src/styles/globals.css         ← utilitários + @layer components
tailwind.config.ts             ← mapeamento Tailwind
```

### Aliases `luxury-*`

Mantidos para migração gradual. Mapeiam para os mesmos tokens semânticos e respondem a `:root` / `.dark`.

## Tipografia

| Token | Tamanho | Uso |
|-------|---------|-----|
| `text-display` | 2.25rem | Hero, landing |
| `text-h1` | 1.875rem | Título de página |
| `text-h2` | 1.5rem | Seções |
| `text-h3` | 1.25rem | Cards, painéis |
| `text-body` | 0.9375rem | Corpo padrão |
| `text-small` | 0.8125rem | Labels, metadados |
| `text-caption` | 0.75rem | Badges, hints |

**Fonte:** Inter Variable (`--font-inter`)

## Espaçamento

Escala base: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (px: 4, 8, 12, 16, 24, 32, 48, 64)

Classes Tailwind: `p-4`, `gap-6`, `space-y-8`, etc.

## Radius

| Token | Valor |
|-------|-------|
| `rounded-sm` | 6px |
| `rounded-md` | 8px |
| `rounded-lg` | 12px |
| `rounded-xl` | 16px |
| `rounded-2xl` | 20px |

## Elevação

| Classe | Uso |
|--------|-----|
| `shadow-xs` | Inputs |
| `shadow-card` | Cards padrão |
| `shadow-card-hover` | Hover interativo |
| `shadow-md` | Dropdowns, popovers |
| `shadow-lg` | Modais |

## Componentes base

Local: `src/components/ui/`

| Componente | Arquivo |
|------------|---------|
| Button | `button.tsx` |
| Card | `card.tsx` |
| Surface | `surface.tsx` |
| Input / Textarea / FormField | `input.tsx` |
| Label | `label.tsx` |
| Badge | `badge.tsx` |
| Skeleton | `skeleton.tsx` |
| DataTable | `data-table.tsx` |
| ThemeToggle | `ThemeToggle.tsx` |
| Async states | `async-state.tsx` |

## Padrões de superfície

Preferir:

```tsx
<Surface variant="interactive" padding="md">...</Surface>
// ou
<div className="surface-card-interactive">...</div>
```

Evitar:

```tsx
className="border-white/10 bg-white/5"  // legado
```

## Tema

`ThemeProvider` em `src/providers/theme-provider.tsx`  
Persistência: `localStorage` key `judgetcg-theme`  
Valores: `light` | `dark` | `system`
