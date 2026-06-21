# Resumo da sessão — 2026-06-08

## Problema reportado

Após deploy, login Google OAuth retorna para a home (`/`) em vez de redirecionar para `/judge` ou perfil.

## Causas identificadas

1. Redirect pós-login só em `SIGNED_IN` — Supabase costuma emitir `INITIAL_SESSION`
2. Race condition: `clearOAuthRedirectState()` quando `getSession()` ainda retornava `null`, apagando flags `oauth_pending` antes do redirect
3. Fallback só em `sessionStorage` — perdido no fluxo OAuth cross-page

## Correções aplicadas

| Arquivo | Mudança |
|---------|---------|
| `src/lib/auth/oauth-redirect.ts` | Flags em sessionStorage + localStorage; `tryConsumeOAuthRedirect()` |
| `src/features/auth/AuthProvider.tsx` | Redirect em getSession e auth change; removido clear prematuro |
| `src/app/auth/callback/route.ts` | Opções completas dos cookies PKCE no redirect |
| `src/middleware.ts` | `/?code=` → `/auth/callback?next=/judge` |
| `tests/auth/oauth-redirect.test.ts` | Testes Vitest |

**Commit:** `fe29273` — fix(auth): redirect OAuth para /judge após login Google

## Deploy Vercel — histórico de bloqueios

| Erro | Fix |
|------|-----|
| `cookiesToSet` implicit any | Tipagem `CookieToSet[]` |
| Unverified commit (Co-authored-by Cursor) | Commit manual sem co-author |
| 18898 files no deploy | Root Directory = `frontend/runtime_console_v3` |
| Path doubling `.next/routes-manifest` | Remover `output: standalone` do next.config |

## Config Supabase necessária

- **Site URL:** `https://judgetcg.com.br`
- **Redirect URLs:** `https://judgetcg.com.br/auth/callback**`

## Config Vercel

- Root Directory: `frontend/runtime_console_v3`
- Output Directory: (vazio)
- Node.js: 20.x
- Include files outside Root Directory: desligado

## Teste pós-deploy

1. Aba anônima → `https://judgetcg.com.br`
2. Login Google na seção "Continuar com Google"
3. Esperado: redirect para `/judge`

## Pendências

- [ ] Validar OAuth em produção após último deploy
- [ ] Confirmar envs Render/Vercel completos
- [ ] Migration `20260607120000_production_performance.sql` se ainda não aplicada
- [ ] Deploy hook GitHub (`VERCEL_DEPLOY_HOOK` secret)

## Repositórios git

- `seekguidance2` → `GCardoso26/seekguidance2`
- `origin` → `guibruno93/seekguidance`
