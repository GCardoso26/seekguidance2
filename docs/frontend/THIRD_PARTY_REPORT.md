# Third-party Scripts Report — RC1.2

**Data:** 2026-07-14

## Inventário

| Script / integração | Como carrega | Blocking? | Rotas |
|---|---|---|---|
| Next / React runtime | first-party chunks | Sim (necessário) | todas |
| `@vercel/analytics` | `layout.tsx` (`Analytics`) | Async / idle (Vercel) | todas (prod) |
| `@vercel/speed-insights` | `layout.tsx` | Async | todas (prod) |
| Stripe.js | on-demand checkout / CSP allowlist | Lazy quando checkout | checkout |
| Google Identity frames | CSP `frame-src accounts.google.com` | On-demand auth | `/entrar` |
| Fontes | self / data (sem Google Fonts runtime bloqueante no path medido) | — | — |

## Lab vs Prod

- Lab local: Insights/Analytics podem 404 em path Vercel — historicamente contribuiu para BP 96; runs RC1.2 lab com BP 100 não registraram console errors destas fontes.
- Stripe não carrega no first paint de `/loja`.

## Ação RC1.2

Nenhuma remoção de third-party — apenas garantir que falhas de telemetria/catálogo não quebrem BP via console.
