# Architecture Decision Records — JudgeTCG Runtime Console

## ADR-001: Framework para painel lojista

### Status

**ACCEPTED** — padrão incremental próprio  
**REJECTED** — Refine, React Admin, MUI, Ant Design

### Contexto

Painel lojista com 5+ rotas CRUD, tema luxury custom, React 19, Next.js 15 App Router. Rotas padronizadas na Fase 2: `/listagens`, `/vendas`, `/estoque`, `/buylist`, `/listagens/nova`.

### Decisão

Manter padrão próprio:

- `PageShell` — layout, título, ações
- `DataTable` (TanStack Table) — desktop
- Cards + skeleton — mobile (375px)
- React Hook Form + zod — formulários
- Hooks React Query — `useSeller*`

Não adotar framework CRUD completo (Refine, React Admin, etc.).

### Justificativa

| Critério | Resultado observado |
|----------|---------------------|
| Bundle por rota | +11–12 KB de rota vs referências antigas; **439 KB** First Load JS em estoque/buylist pós lazy load (meta 445/453 KB) |
| Tempo por rota | ~4–6 h (PageShell + hook + form + cards) |
| Theming luxury | Tailwind nativo, zero override de tema de lib |
| React 19 | Sem issues de hydration ou peer deps de framework |
| Testabilidade | 15+ testes Vitest; E2E Playwright com auth bootstrap |
| Mobile | Degradação cards em todas as rotas padronizadas |
| Plan gating | `useMerchantKycGuard` / subscription integrados sem abstração extra |

### Consequências

- Nova rota = copiar template em `src/components/seller-dashboard/_TEMPLATE_NEW_ROUTE.md`
- Time mantém componentes base (`PageShell`, `DataTable`, guards)
- Sem dependência de framework externo nem lock-in de UI kit

### Alternativas consideradas

- **Refine** — rejeitado: bundle (+100–500 KB estimado), theming, curva de aprendizado
- **React Admin** — rejeitado: Material UI default, incerteza React 19
- **AG Grid Enterprise** — rejeitado: licença

### Referências

- `docs/E2E_SETUP.md` — auth Playwright
- `src/components/seller-dashboard/_TEMPLATE_NEW_ROUTE.md` — checklist nova rota
- `docs/SELLER_PANEL_LESSONS_LEARNED.md` — lições consolidadas

### Resultados pós-implementação (2026-06-29)

| Rota | Bundle | Entregue |
|------|--------|----------|
| `/listagens` | 369 KB | Fase 0 |
| `/listagens/nova` | 407 KB | Fase 1 |
| `/vendas` | ~430 KB | Fase 1 |
| `/estoque` | 439 KB | Fase 2 |
| `/buylist` | 439 KB | Fase 2 |
| `/clientes` | 440 KB | CRM |
| `/estatisticas` | 427 KB | Analytics |
| `/pdv` | 435 KB | PDV v1 |

**Média:** ~423 KB | **Meta painel:** ≤ 450 KB | **Status:** 8/8 dentro da meta

### Exceção: marketplace comprador (`/marketplace`)

| Métrica | Valor | Meta |
|---------|-------|------|
| First Load JS | **495 KB** (pós hotfix bundle) | ≤ 450 KB (painel) / **≤ 500 KB** (público) |
| Shared chunk | ~342 KB | ≤ 346 KB ✅ |
| Page chunk | ~2.8 KB (shell) + async browse | — |

**Justificativa da meta ampliada (≤ 500 KB):**

- Página **pública** de alto valor (conversão), sem auth guard — primeira impressão do marketplace.
- **Infinite scroll** + filtros facetados (padrão e-commerce) exigem React Query e painel de filtros.
- Hotfix aplicado: lazy load de `MarketplaceShopBrowse`, `ProductFilters` (Radix drawer), `ProductGrid`, decklists; lista compacta de jogos; `useDebounce` compartilhado.
- Shared chunk permanece dentro da meta; o delta (+~72 KB vs média painel) está no chunk assíncrono da rota, não no bundle base.

**Status:** ✅ dentro da meta **≤ 500 KB** para rotas públicas de catálogo.

- **E2E:** 42/42 passando
- **Vitest:** 21+ testes
- **Template:** `_TEMPLATE_NEW_ROUTE.md` replicado 8×

### Lições aprendidas (pós-otimização Fase 3)

| Lição | Aplicação futura |
|-------|------------------|
| `dynamic()` em modais RHF+zod | Toda rota com form deve lazy-load o modal |
| `dynamic()` em PIX/pagamento | `BuylistPixPayment`, widgets de checkout |
| Schema zod só no modal, nunca na page | Evita chunk principal inchado |
| `DesktopView` lazy desde o POC | Padrão estabilizado — replicar em novas rotas |
| `Manager` lazy na page | Reduz First Load JS da rota (~48 KB em estoque/buylist) |

---

## ADR-002: Arquitetura PDV (spike)

**Status:** ACCEPTED (v1 entregue) — ver [`docs/ADR-002-PDV-ARCHITECTURE.md`](./ADR-002-PDV-ARCHITECTURE.md)

Spike (2026-06-22): barcode keyboard wedge, `window.print`, PIX async, estoque pessimista online, rota 100% `"use client"`. **Épico PDV v1** entregue em 2026-06-29 — 435 KB First Load JS, 42/42 E2E.
