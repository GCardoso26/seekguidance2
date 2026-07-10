# Theme Tokens — JudgeTCG v2

## Core (HSL channels)

### Light (`:root`)

| Token | HSL | Uso |
|-------|-----|-----|
| `--background` | 220 20% 98% | Fundo da aplicação |
| `--foreground` | 224 28% 11% | Texto principal |
| `--card` | 0 0% 100% | Superfícies elevadas |
| `--muted` | 220 14% 96% | Fundos secundários |
| `--muted-foreground` | 220 9% 46% | Texto secundário |
| `--border` | 220 13% 91% | Bordas |
| `--primary` | 262 70% 50% | Brand (índigo Judge) |
| `--ring` | 262 70% 50% | Focus ring |

### Dark (`.dark`)

| Token | HSL | Notas |
|-------|-----|-------|
| `--background` | 224 28% 7% | Não é preto absoluto |
| `--foreground` | 210 20% 96% | |
| `--card` | 224 26% 10% | |
| `--primary` | 262 70% 58% | Mais luminoso para contraste |

## Semantic

| Token | Light | Uso |
|-------|-------|-----|
| `--success` | 142 71% 45% | Confirmações |
| `--warning` | 38 92% 50% | Alertas |
| `--danger` | 0 72% 51% | Erros, exclusão |

## Luxury aliases (migração)

| Classe Tailwind | Variável CSS |
|-----------------|--------------|
| `text-luxury-gold` | `--luxury-gold` → brand primary |
| `bg-luxury-onyx` | `--luxury-onyx` → background |
| `text-luxury-frost` | `--luxury-frost` → foreground |
| `text-luxury-mist` | `--luxury-mist` → muted-foreground |
| `bg-luxury-obsidian` | `--luxury-obsidian` → card |

## Condição de carta

```css
--condition-nm / lp / mp / hp / dm
```

## TCG por jogo

`src/lib/tcg-tokens.ts` — cores de marca por jogo (MTG, Pokémon, etc.)  
`src/styles/tcg-theme.ts` — injeção runtime `--tcg-*`

## Painéis operacionais

`src/styles/seller-panel.css` — `--panel-bg`, `--panel-surface`, `--panel-elevated`

Mapeados para tokens globais no DS v2.

## Uso em Tailwind

```tsx
className="bg-background text-foreground border-border"
className="bg-primary text-primary-foreground"
className="text-muted-foreground"
```

## Uso em CSS

```css
background: hsl(var(--card));
border: 1px solid hsl(var(--border));
box-shadow: var(--shadow-sm);
```
