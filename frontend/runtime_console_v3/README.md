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

Legacy HTML consoles in `apps/runtime_*_console/` remain available.
