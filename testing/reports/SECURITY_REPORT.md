# SECURITY_REPORT — AUDIT_PASS_2026-07-29

**READY claim:** NÃO seguro para Beta público com pagamentos.

## Evidência desta pass

| Check | Resultado |
|---|---|
| Supabase security advisors | 135 lints (22 WARN, 113 INFO) |
| OWASP full manual | **Não executado** |
| Scan XSS sinks `dangerouslySetInnerHTML` | Presentes em community/newsletter/search highlight/JSON-LD — **revisão sanitizer não refeita** |
| Secrets em git | Não escaneado exaustivamente nesta pass |
| Sentry | disabled em prod health |

## WARNs prioritários

1. **SECURITY DEFINER executável por anon** — `handle_new_user_google_confirm`, `rls_auto_enable` (AUDIT-006)
2. **RLS always-true INSERT** — analytics_events, newsletter_subscribers (AUDIT-007)
3. **Auth leaked password protection** off (AUDIT-008)
4. **Public bucket listing** — community-images
5. **function_search_path_mutable** ×13
6. **extension vector in public**

## INFO relevante

Muitas tabelas `cart.*` / `marketplace.*` com RLS enabled **sem** policies → efetivamente deny via PostgREST. Aceitável se acesso só via service role; risco se alguém expor keys.

## Headers / CSRF / JWT

Não revalidados nesta pass (ver reports QA_PLATFORM_V6_SECURITY históricos — **não confiar sem re-prova**).

## Ação

Remediar AUDIT-006/007/008 antes de qualquer anúncio público de auth/marketplace.
