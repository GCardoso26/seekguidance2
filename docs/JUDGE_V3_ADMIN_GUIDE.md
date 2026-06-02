# Judge TCG v3.0 — Guia de Acesso Admin

## Acesso Admin — Dual Login

O Judge TCG usa **dois sistemas de autenticação** distintos. Isto é intencional na v3.0 e será unificado numa versão futura.

### Para consultar regras (Judge `/judge`)

1. Abra a landing em `/` (judgetcg.com.br).
2. Clique **Continuar com Google**.
3. Login via **Supabase Auth** (OAuth Google, sem confirmação de email após a migration de produção).
4. É redirecionado para `/judge`.

**Admin no Judge:** o email deve constar em `NEXT_PUBLIC_JUDGE_ADMIN_EMAILS` (Vercel) ou `app_metadata.role = admin` no Supabase. Só então vê **Métricas** e **Console** no header.

### Para ingestão de PDF (Console `/admin`)

1. Aceda a `/login` do **Runtime Console**.
2. Faça login com utilizador **admin** ou **operator** (cookie JWT `tcg_access`).
3. Vá a `/admin/console` → **Upload SWU** ou `/admin/ingestion`.

O upload chama `POST /runtime/admin/ingestion/upload` via BFF autenticado — **não** usa a sessão Supabase do Judge.

### Por que dois logins?

| Sistema | Público | Auth | Acesso |
|---------|---------|------|--------|
| **Judge** | Jogadores | Supabase Google OAuth | Consultas, histórico cloud, feedback |
| **Console** | Operações | JWT próprio (Render API) | Ingestão, métricas infra, reindex, upload PDF |

### Rotas protegidas (middleware Next.js)

- `/observability/*`
- `/admin/*`
- `/ingestion/*`

Sem credencial admin válida → redirect para `/judge` ou `/login`.

### Variáveis de ambiente (produção)

| Variável | Onde | Notas |
|----------|------|--------|
| `NEXT_PUBLIC_APP_URL` | Vercel | Ex.: `https://judgetcg.com.br` |
| `API_PROXY_TARGET` | Vercel | Ex.: `https://seekguidance.onrender.com` |
| `NEXT_PUBLIC_JUDGE_ADMIN_EMAILS` | Vercel | Emails admin separados por vírgula |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | Projeto Supabase de **produção** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Chave anon (nunca service role no frontend) |

### Supabase — migration obrigatória

Aplicar em produção:

`supabase/migrations/20260602120000_auto_confirm_google.sql`

```bash
supabase link --project-ref <PROD_PROJECT_REF>
supabase db push --dry-run
supabase db push
```

Confirmar que o projeto ligado ao Vercel é o mesmo onde a migration foi aplicada.

### Futuro: unificação

Plano: single sign-on Judge + Console (issue de produto em aberto) — OAuth Supabase com claims para `ingestion_admin` no mesmo token ou proxy unificado no BFF.

### Checklist rápido (admin)

- [ ] Email em `NEXT_PUBLIC_JUDGE_ADMIN_EMAILS` no Vercel
- [ ] Migration Google auto-confirm aplicada no Supabase prod
- [ ] Login Google na landing → `/judge` OK
- [ ] Botões Métricas/Console visíveis só para admin
- [ ] Login `/login` console → upload PDF SWU em `/admin/ingestion`
