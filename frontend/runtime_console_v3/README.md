# Runtime Console v3

Operational UI for TCG Judge Runtime Platform.

## Dev

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 — API default `http://127.0.0.1:8000`.

## Stack

Next.js 14, React 18, TypeScript, Tailwind, Radix, Zustand, TanStack Query, Recharts, Framer Motion.

## Deploy

See `infra/runtime_console_v3/` and `docs/FRONTEND_DEPLOYMENT.md`.

## Painel do Vendedor (`/vendedor/painel`)

Fluxo operacional reorganizado em sprints:

| Módulo | Rotas |
|--------|--------|
| Dashboard | `/vendedor/painel` |
| Pedidos | `/vendedor/painel/pedidos` |
| Catálogo | `/catalogo/cartas`, `/produtos`, `/expansoes`, `/jogos` |
| Clientes | `/clientes/lista` |
| Atendimento | `/atendimento/tickets` |
| Financeiro | `/financeiro/receitas`, `/repasses`, `/stripe`, `/pix` |
| Equipe | `/equipe/usuarios`, `/permissoes`, `/logs` |
| Configurações | `/configuracoes`, `/notificacoes` |

**Atalhos:** `Ctrl+K` / `⌘K` busca global · `?` atalhos de teclado

**Feature flags:** `src/lib/feature-flags.ts` (`NEXT_PUBLIC_FEATURE_*`)

