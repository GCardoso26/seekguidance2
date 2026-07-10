# UI Guidelines — JudgeTCG

## Identidade visual

**Sensação alvo:** Stripe · Linear · Vercel · Notion  
**Identidade própria:** índigo Judge + acentos TCG, sem copiar concorrentes.

### O que evitar

- Preto absoluto (`#000`) em grandes áreas
- Branco puro (`#fff`) como único fundo sem hierarquia
- Excesso de cinza sem contraste
- `border-white/10 bg-white/5` em código novo
- Animações chamativas ou bounce excessivo

### O que priorizar

- Superfícies em camadas (background → card → elevated)
- Hierarquia tipográfica clara
- Espaçamento generoso (mín. 16px entre blocos)
- Hover discreto (sombra + borda, não scale agressivo)
- Focus visível em todos os interativos

## Layout

### Container de página

```tsx
<div className="page-container">...</div>
```

Max-width: `7xl` (1280px), padding responsivo.

### Header consumer

- Altura: 48px mobile / 56px desktop
- Busca sempre visível no centro
- Ações à direita: tema, wishlist, carrinho, perfil

### Sidebar painéis

Agrupamentos:

1. **Marketplace** — listagens, pedidos, catálogo
2. **Minha Conta** — configurações, planos
3. **Operação** — financeiro, equipe, insights
4. **Judge** — regras, torneios (quando aplicável)

Item ativo: `bg-primary/10 text-primary`

## Marketplace

### Listing cards

- Imagem em `aspect-square` ou `aspect-[63/88]` para singles
- Preço em `font-mono font-semibold`
- CTA primário full-width no rodapé do card
- Badges para condição, foil, estoque

### Página da carta

- Imagem hero à esquerda (desktop)
- Painel de compra sticky à direita
- Tabs para: ofertas, histórico, intelligence, judge

## Formulários

- Largura máxima: `max-w-lg` para forms simples, `max-w-2xl` para wizards
- `FormField` + `Label` + `Input` sempre juntos
- Erro abaixo do campo (`field-error.tsx`)
- Botão primário alinhado à direita em modais

## Estados

| Estado | Componente |
|--------|------------|
| Loading | `Skeleton`, `SkeletonCard`, `PageSkeleton` |
| Empty | `PageEmpty` em `async-state.tsx` |
| Error | `PageError` |
| Offline | Mensagem + retry |

## Acessibilidade

- Contraste mínimo 4.5:1 (texto normal)
- `focus-ring` em todos os interativos
- `aria-label` em botões icon-only
- Skip link no `MobileLayout`
- Touch targets ≥ 44px no mobile

## Animações

| Tipo | Duração | Uso |
|------|---------|-----|
| fade-in | 200–300ms | Entrada de página |
| hover-lift | 200ms | Cards interativos |
| scale active | 98% | Botões |

Sem parallax, sem animações > 400ms em UI crítica.

## Responsividade

Breakpoints Tailwind padrão: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280

Testar: mobile bottom nav, tablet sidebar colapsável, desktop layout completo.
