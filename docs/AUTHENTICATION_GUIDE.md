# Autenticação Judge (Wave 2B)

## Visão geral

O Judge suporta login social via **Supabase Auth** (Google). Sem Supabase configurado, o produto continua anónimo com histórico em `localStorage`.

## Variáveis (frontend)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://judgetcg.com.br
```

**Segurança:** use apenas a chave **anon** (JWT com `"role":"anon"`). Nunca coloque `service_role` em variáveis `NEXT_PUBLIC_*` — isso expõe acesso total à base no browser. Ver `docs/SECURITY_CREDENTIAL_ROTATION.md` se houve leak em `.env.example`.

## Componentes

- `src/features/auth/AuthProvider.tsx` — sessão, refresh automático
- `LoginButton` / `UserMenu` — UI no header do Judge
- `ProtectedHistory` — blocos que exigem utilizador autenticado

## Histórico cloud

Com utilizador autenticado, as conversas são persistidas via API:

- `POST /runtime/judge/session` (header `X-Judge-User-Id`)
- `GET /runtime/judge/session/{uuid}`

Deep link: `/judge?session=<UUID>`

## Fallback

Se Supabase ou Postgres falharem, `judge-history.ts` (localStorage) mantém o histórico local sem perda de funcionalidade base.
