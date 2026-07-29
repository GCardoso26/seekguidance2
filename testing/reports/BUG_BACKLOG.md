# BUG_BACKLOG — AUDIT_PASS_2026-07-29

Formato obrigatório. Status: OPEN salvo indicação.

---

## AUDIT-20260729-001

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-001 |
| **Severidade** | P0 |
| **Reprodução** | Probe 2026-07-29T22:40Z: `payments=misconfigured`, `platform_pix=disabled`, `openpix=disabled` (antes era `deferred`) |
| **Impacto** | Checkout real / PIX indisponível; Beta público sem compra |
| **Causa Raiz** | `PAYMENTS_ENABLED` aparentemente true em prod sem `PLATFORM_PIX_KEY` |
| **Correção** | Ops: setar `PLATFORM_PIX_KEY` (+ type); ou reverter `PAYMENTS_ENABLED=false` até ter chave; depois `certify:checkout:prod` |
| **Arquivos alterados** | `health_check.py` (`go_live_blockers`); `docs/GO_LIVE.md` — **ainda local, não deployado** |
| **Testes criados** | `test_go_live_blockers_*` em `test_sprint7.py` |
| **Evidência** | health live sem campo `go_live_blockers`; `gitCommit=c3ce4c8c` ≠ working tree P0 |
| **Status** | BLOCKED_ON_OPS (pior: misconfigured) |

---

## AUDIT-20260729-002

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-002 |
| **Severidade** | P0 |
| **Reprodução** | Health → `melhor_envio.status=disabled`, `token_set=false` |
| **Impacto** | Frete/checkout fulfillment incompleto |
| **Causa Raiz** | Integração Melhor Envio não configurada em prod |
| **Correção** | Ops: `MELHOR_ENVIO_TOKEN` + `MELHOR_ENVIO_FROM_ADDRESS` JSON (+ `SHIPPING_V2_ENABLED`) |
| **Arquivos alterados** | `health_check.py` (`go_live_blockers`); `docs/GO_LIVE.md` |
| **Testes criados** | `test_go_live_blockers_*` |
| **Evidência** | Health lista `melhor_envio_disabled` até secret existir |
| **Status** | BLOCKED_ON_OPS |

---

## AUDIT-20260729-003

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-003 |
| **Severidade** | P0 |
| **Reprodução** | Histórico 2026-07-29 ~04:59Z: Postgres `No space left on device`; API `database:error` + `econnrefused` Supavisor |
| **Impacto** | Outage total de catálogo/auth/marketplace enquanto disco cheio |
| **Causa Raiz** | Capacidade de disco do projeto Supabase esgotada |
| **Correção** | Ops disco Supabase (plano/limpeza); código: reduzir write storm via lock em asset versions (ver AUDIT-004) |
| **Arquivos alterados** | `AssetVersioningService.ts` (advisory lock; mitiga pressão WAL) |
| **Testes criados** | `AssetVersioningLogic.test.ts` concorrência |
| **Evidência** | runtime database ok; race de version serializado (004 FIXED) |
| **Status** | MITIGATED (write pressure) / DISK_OPS OPEN |

---

## AUDIT-20260729-004

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-004 |
| **Severidade** | P1 |
| **Reprodução** | Logs Postgres: `duplicate key value violates unique constraint "uq_asset_version"` (dezenas em minutos) |
| **Impacto** | Sync de assets falha/parcial; versões inconsistentes |
| **Causa Raiz** | Append de version sem idempotência / race entre workers |
| **Correção** | Transação + `pg_advisory_xact_lock(hashtext(asset_id))` + retry em `23505` |
| **Arquivos alterados** | `AssetVersioningService.ts` |
| **Testes criados** | `AssetVersioningLogic.test.ts` — 4 appends concorrentes → versions `[1,2,3,4]` |
| **Evidência** | vitest AssetVersioningLogic 2/2 pass (2026-07-29) |
| **Status** | FIXED |

---

## AUDIT-20260729-005

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-005 |
| **Severidade** | P1 |
| **Reprodução** | `npx vitest run` em `frontend/runtime_console_v3` → 6 falhas (5 após fix MobileLayout) |
| **Impacto** | CI/confiança de regressão |
| **Causa Raiz** | Testes desalinhados / regressões de UI (GameSelector aria, CardCard, SellerOffersTable, tcg-logos, seller-plans) |
| **Correção** | Corrigir produto ou atualizar contratos de teste com evidência |
| **Arquivos alterados** | `tests/components/mobile/MobileLayout.test.tsx` (fix nesta pass) |
| **Testes criados** | atualização MobileLayout |
| **Evidência** | vitest summary 472 pass / 6 fail |
| **Status** | PARTIAL |

---

## AUDIT-20260729-006

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-006 |
| **Severidade** | P1 |
| **Reprodução** | Supabase advisor security: `anon_security_definer_function_executable` em `public.handle_new_user_google_confirm`, `public.rls_auto_enable` |
| **Impacto** | Superfície de ataque via RPC |
| **Causa Raiz** | EXECUTE concedido a anon em SECURITY DEFINER |
| **Correção** | Revogar EXECUTE de anon; auditar funções |
| **Arquivos alterados** | — |
| **Testes criados** | — |
| **Evidência** | get_advisors security WARN |
| **Status** | OPEN |

---

## AUDIT-20260729-007

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-007 |
| **Severidade** | P1 |
| **Reprodução** | Advisor: `rls_policy_always_true` em `analytics_events`, `newsletter_subscribers` |
| **Impacto** | Insert aberto / abuso |
| **Causa Raiz** | Policies WITH CHECK true |
| **Correção** | Restringir inserts; rate limit; captcha se público |
| **Arquivos alterados** | — |
| **Testes criados** | — |
| **Evidência** | advisors |
| **Status** | OPEN |

---

## AUDIT-20260729-008

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-008 |
| **Severidade** | P1 |
| **Reprodução** | Advisor: `auth_leaked_password_protection` WARN |
| **Impacto** | Senhas vazadas não bloqueadas |
| **Causa Raiz** | Proteção HaveIBeenPwned desligada no Auth |
| **Correção** | Habilitar no dashboard Supabase Auth |
| **Arquivos alterados** | — |
| **Testes criados** | — |
| **Evidência** | advisors |
| **Status** | OPEN |

---

## AUDIT-20260729-009

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-009 |
| **Severidade** | P2 |
| **Reprodução** | 113 INFO `rls_enabled_no_policy` (cart/marketplace tables) |
| **Impacto** | RLS on sem policies = deny-all via PostgREST (pode ser intencional se só service role) |
| **Causa Raiz** | Schemas acessados só pela API Python/Node |
| **Correção** | Documentar intentional deny-all ou adicionar policies |
| **Arquivos alterados** | — |
| **Testes criados** | — |
| **Evidência** | advisors INFO |
| **Status** | OPEN |

---

## AUDIT-20260729-010

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-010 |
| **Severidade** | P2 |
| **Reprodução** | Performance advisors: 68 `auth_rls_initplan` + 87 `multiple_permissive_policies` |
| **Impacto** | Latência RLS sob carga |
| **Causa Raiz** | Policies reavaliam `auth.uid()` por row |
| **Correção** | `(select auth.uid())` pattern; consolidar policies |
| **Arquivos alterados** | — |
| **Testes criados** | — |
| **Evidência** | get_advisors performance |
| **Status** | OPEN |

---

## Contagem

| Sev | OPEN |
|---|---|
| P0 | 3 (1 mitigated risk) |
| P1 | 5 |
| P2 | 2 |
