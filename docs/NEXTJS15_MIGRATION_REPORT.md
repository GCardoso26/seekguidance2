# Next.js 15 Migration Report

## Estado

| Item | Status |
|------|--------|
| Baseline audit | `docs/NPM_AUDIT_BASELINE.md` |
| Upgrade 14 → 15 | **Pendente** (breaking; requer sprint dedicada) |
| Build 14.2.35 produção | OK (commit 71f78c2+) |

## Bloqueadores conhecidos

- `@supabase/ssr` — validar compatibilidade com Next 15
- CSP custom em `next.config.mjs` — retestar dev/prod
- Edge route `/api/og/verdict` — validar `@vercel/og`
- React 19 peer deps com Next 15

## Checklist pós-upgrade

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `/judge` SSE streaming
- [ ] Login Google Supabase
- [ ] Rewrites `API_PROXY_TARGET`
- [ ] Cookies auth HttpOnly

## Comando proposto

```bash
npm install next@15 react@19 react-dom@19
```

Depois corrigir breaking changes listados em https://nextjs.org/docs/app/building-your-application/upgrading/version-15
