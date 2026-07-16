# Sprint 7.1 — Fundação Frontend

**Status:** Entregue  
**App:** `apps/web` (Next.js 15 · TS strict · Tailwind · TanStack Query · Zod · RHF)

## Hipótese

Camada de experiência tipada sobre `/api/v1/*`, sem domínio no browser.

```text
Browser → apps/web → Typed API Clients → /api/v1/*
```

## Entregas

| Área | Item |
|------|------|
| Clients | `authApi` · `publicApi` · `marketplaceApi` · `checkoutApi` |
| Auth | register · login · refresh · logout · AuthProvider · session |
| UX | `/register` · `/login` · `/session` · `/seller` (guards) |
| Data | QueryClientProvider |
| Analytics | `Analytics.track()` stub |
| Testes | Vitest (auth/session/guards) · Playwright (fluxo auth) |

## Sessão / tokens

| Token | Storage |
|-------|---------|
| Access | Memory |
| Refresh | `sessionStorage` (compat body da API) |

Débito **SECURITY-001** — migrar refresh para cookie HttpOnly antes de produção pública.

## Proxy

`next.config.ts` reescreve `/api/v1/*` → `API_ORIGIN` (default `http://127.0.0.1:8789`). Não é BFF.

## Frontend Hardening (pós-beta — não nesta sprint)

- SSR auth strategy
- CSP
- refresh cookie HttpOnly (SECURITY-001)
- CDN assets
- image optimization
- frontend error tracking

## Próximo

**7.2** Buyer Search → PDP → Offers
