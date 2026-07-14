# Security Headers Report — RC1.2

**Data:** 2026-07-14  
**Fonte:** `GET http://localhost:3000/loja` (prod build) + `next.config.mjs`  
**Escopo:** apenas relatório (sem redesign de deploy)

## Headers observados (lab)

| Header | Valor |
|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; … frame-ancestors 'none'` |
| X-Frame-Options | `DENY` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |
| X-Content-Type-Options | `nosniff` |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains; preload` |

## Notas

- CSP permite Stripe (`js.stripe.com`, `api.stripe.com`, hooks/frames).
- `unsafe-inline` em script/style permanece (Next) — known limitation.
- Cross-Origin isolation headers (`COOP`/`COEP`) **não** configurados — fora do escopo RC1.2.
