# UI Audit Report — JudgeTCG Modernization Sprint

**Data:** 2026-07-10  
**Escopo:** Frontend `runtime_console_v3`  
**Restrições respeitadas:** sem alterações em backend, APIs, rotas, feature flags ou arquitetura DDD/CQRS

---

## Nota atual (antes)

**4.2 / 10** — Produto funcional com arquitetura madura, mas percepção visual de painel administrativo escuro.

### Problemas identificados

| Área | Problema |
|------|----------|
| Tema | Dark forçado globalmente; light subutilizado |
| Tokens | 3 camadas conflitantes: shadcn HSL, luxury hex, panel CSS |
| Primary | Azul/roxo inconsistente vs gold luxury como CTA |
| Tipografia | `--font-geist-sans` referenciado mas não carregado |
| Componentes | Duplicação `ui/` vs `luxury/ui/` |
| Superfícies | `border-white/10 bg-white/5` copiado em dezenas de arquivos |
| Header | Alto, escuro, baixo contraste |
| Cards marketplace | Estilos divergentes entre `ProductCard` e `CardCard` |
| Empty states | 5+ implementações fragmentadas |
| Sidebars | 3 sidebars sem padrão compartilhado |
| Animações | Keyframes triplicados em 3 arquivos CSS |

---

## Nota após melhorias (esta sprint)

**7.8 / 10** — DS em massa + página da carta + checkout visual (steps + resumo sticky).

> Nota 8+ requer polish final em carrinho, PanelShell seller/admin e validação Lighthouse.

---

## Componentes refeitos

| Componente | Arquivo | Mudança |
|------------|---------|---------|
| Button | `components/ui/button.tsx` | Variantes CVA expandidas, focus-ring, scale sutil |
| Card | `components/ui/card.tsx` | Variants: default, elevated, interactive, ghost |
| Input / Textarea / FormField | `components/ui/input.tsx` | Padrão formulário unificado |
| Label | `components/ui/label.tsx` | Tokens semânticos |
| Badge | `components/ui/badge.tsx` | CVA com 7 variantes |
| Skeleton | `components/ui/skeleton.tsx` | Shimmer + presets (card, table, dashboard) |
| Surface | `components/ui/surface.tsx` | **Novo** — substitui superfícies ad hoc |
| DataTable | `components/ui/data-table.tsx` | **Novo** — sticky header, hover, densidade |
| ThemeToggle | `components/ui/ThemeToggle.tsx` | **Novo** |
| GlobalHeader | `components/layout/GlobalHeader.tsx` | Light, compacto, busca central |
| MobileLayout | `components/layout/MobileLayout.tsx` | Background semântico, bottom nav refinado |
| ProductCard | `components/marketplace/ProductCard.tsx` | E-commerce moderno |
| CardCard | `components/cards/CardCard.tsx` | Alinhado ao ProductCard |
| BuyerDashboard StatCard | `components/buyer/BuyerDashboardPage.tsx` | Surface interactive |
| Seller Sidebar nav | `components/seller-dashboard/Sidebar.tsx` | Estados ativos primary |

---

## Componentes padronizados (tokens)

| Sistema | Status |
|---------|--------|
| `design-tokens.css` | Criado — fonte de verdade HSL |
| `globals.css` | Reescrito — light-first, utilitários |
| `tailwind.config.ts` | luxury-* → CSS variables |
| `theme-provider.tsx` | Light default + dark opcional |
| `seller-panel.css` | Alinhado aos tokens globais |
| Classes utilitárias | `surface-card`, `page-container`, `section-title`, `focus-ring` |

---

## Páginas revisadas (diretamente)

| Página / Shell | Impacto |
|----------------|---------|
| Todas via `layout.tsx` | Tema light default, toasts semânticos |
| Consumer shell | Header + bottom nav + background |
| `/comprador` | KPI cards |
| Marketplace cards | ProductCard, CardCard em grids existentes |
| Seller panel sidebar | Estados de navegação |

### Páginas com migração automática parcial (via luxury aliases)

Todas que usam `bg-luxury-onyx`, `text-luxury-frost`, `text-luxury-mist`, `text-luxury-gold` recebem novos valores HSL em light/dark.

---

## Inconsistências encontradas (pendentes)

| Item | Arquivos afetados | Prioridade |
|------|-------------------|------------|
| `text-white` em overlays/botões | ~90 (muitos intencionais) | Baixa |
| `bg-black/` em modais e imagens | ~60 | Baixa |
| Página detalhe da carta | **refeita** — hero + painel sticky | ~~Alta (próxima)~~ |
| Checkout visual | **refeito** — steps + resumo sticky | ~~Alta (próxima)~~ |
| `luxury-marketing.css` | preservado (marketing) | Baixa |
| Runtime console (`app-shell`) | legado | Baixa |
| Judge table CSS | tema próprio (intencional) | Baixa |

### Migração em massa (2026-07-10)

Script: `frontend/runtime_console_v3/scripts/migrate-ds-classes.mjs`

- **3435** substituições em **431** arquivos
- Padrões migrados: `border-white/10`, `bg-white/5`, `luxury-*` → tokens semânticos
- `luxury/ui/Button` e `Card` → re-exportam `components/ui/*`

---

## Melhorias implementadas

### Design System
- Paleta light-first inspirada em Stripe/Linear/Vercel
- Tipografia Inter com escala display → caption
- Escala de espaçamento 4–64
- Radius e elevation padronizados
- Dark mode opcional com persistência

### UX
- Header mais baixo (48–56px vs 56px+ escuro)
- Busca sempre acessível
- Toggle de tema no header
- Cards marketplace com hierarquia clara e CTA consistente
- Focus ring WCAG em botões e inputs
- Skeletons específicos por contexto

### Performance
- Sem novas dependências
- CSS variables (zero runtime JS para cores)
- Animações reduzidas e unificadas

### Documentação
- `docs/frontend/design-system.md`
- `docs/frontend/theme-tokens.md`
- `docs/frontend/ui-guidelines.md`
- `docs/frontend/component-standards.md`
- `docs/frontend/page-patterns.md`
- `scripts/migrate-ds-classes.mjs` — codemod reutilizável

---

## Arquivos alterados

### Tokens e estilos
- `src/styles/design-tokens.css` (novo)
- `src/styles/globals.css`
- `src/styles/seller-panel.css`
- `tailwind.config.ts`

### Providers e layout
- `src/providers/theme-provider.tsx`
- `src/app/layout.tsx`

### UI primitives
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/surface.tsx` (novo)
- `src/components/ui/data-table.tsx` (novo)
- `src/components/ui/ThemeToggle.tsx` (novo)
- `src/components/ui/async-state.tsx`

### Layout e marketplace
- `src/components/layout/GlobalHeader.tsx`
- `src/components/layout/MobileLayout.tsx`
- `src/components/marketplace/ProductCard.tsx`
- `src/components/cards/CardCard.tsx`
- `src/components/buyer/BuyerDashboardPage.tsx`
- `src/components/seller-dashboard/Sidebar.tsx`

### Documentação
- `docs/frontend/*.md` (5 arquivos)
- `UI_AUDIT_REPORT.md`

---

## Próximos passos

### Sprint imediata (alto impacto visual)
1. ~~**Migração em massa**~~ — concluída (`migrate-ds-classes.mjs`)
2. **Página da carta** — layout hero + painel de compra sticky
3. **Checkout** — steps visuais + resumo sticky
4. ~~**Deprecar** `components/luxury/ui/Button` e `Card`~~ — re-exports criados
5. **PanelShell** — componente compartilhado seller + admin

### Sprint seguinte
6. Wishlist page visual refresh
7. Smart cart e carrinho
8. Filtros marketplace (drawer + sidebar)
9. Consolidar EmptyStates em `async-state.tsx`
10. Lighthouse audit pós-migração completa

### Critério para nota 8+
- 95%+ das páginas usando tokens semânticos
- Zero classes luxury hardcoded em componentes novos
- Contraste WCAG AA validado em light e dark
- Todas as tabelas via `DataTable`
- Sign-off de design em 5 fluxos críticos: home, busca, carta, checkout, seller overview

---

## Verificação

```bash
cd frontend/runtime_console_v3
npm run type-check   # ✅ passou
```

Build recomendado antes de deploy: `npm run build` com `NODE_OPTIONS=--max-old-space-size=8192`
