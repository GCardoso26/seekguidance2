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
| **Arquivos alterados** | `health_check.py` (`go_live_blockers`); `docs/GO_LIVE.md` — deploy `c0c04b2c` |
| **Testes criados** | `test_go_live_blockers_*` em `test_sprint7.py` |
| **Evidência** | Probe 2026-07-30T01:11Z: `payments=misconfigured`, blocker `payments_misconfigured` listado |
| **Status** | BLOCKED_ON_OPS (misconfigured) |

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
| **Evidência** | Probe 01:11Z: `melhor_envio_disabled` em `go_live_blockers`; `token_set=false` |
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
| **Evidência** | vitest 2/2; deploy `c0c04b2c`; logs: último burst uq_asset_version ~22:43Z 2026-07-29, silêncio no slice recente |
| **Status** | FIXED (monitorar workers/cron) |

---

## AUDIT-20260729-005

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-005 |
| **Severidade** | P1 |
| **Reprodução** | `npx vitest run` → 5 falhas (GameSelector, CardCard, SellerOffersTable, tcg-logos, seller-plans) |
| **Impacto** | CI/confiança de regressão |
| **Causa Raiz** | TEST DRIFT — sandbox Vitest, ADR-016 11 jogos, copy/aria |
| **Correção** | Testes alinhados; `aria-label` no botão Ver do CardCard |
| **Arquivos alterados** | 5 test files + `CardCard.tsx` |
| **Testes criados** | atualização dos 5 |
| **Evidência** | vitest 19/19 nos arquivos alvo (2026-07-30) |
| **Status** | FIXED |

---

## AUDIT-20260729-006

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-006 |
| **Severidade** | P1 |
| **Reprodução** | Advisor: `anon_security_definer_function_executable` em `handle_new_user_google_confirm`, `rls_auto_enable` |
| **Impacto** | Superfície de ataque via RPC |
| **Causa Raiz** | EXECUTE concedido a anon em SECURITY DEFINER |
| **Correção** | `REVOKE ALL … FROM PUBLIC, anon, authenticated` |
| **Arquivos alterados** | `20260730015909_p1_security_revoke_and_rls_tighten.sql` (aplicada em prod) |
| **Testes criados** | — |
| **Evidência** | `anon_exec=false`, `auth_exec=false`; advisors: `anon_secdef=0` |
| **Status** | FIXED |

---

## AUDIT-20260729-007

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-007 |
| **Severidade** | P1 |
| **Reprodução** | Advisor: `rls_policy_always_true` em `analytics_events`, `newsletter_subscribers` |
| **Impacto** | Insert aberto / abuso |
| **Causa Raiz** | Policies WITH CHECK true |
| **Correção** | DROP policies; inserts só via API service_role |
| **Arquivos alterados** | mesma migration P1 |
| **Testes criados** | — |
| **Evidência** | advisors `always_true=0`; policies insert removidas |
| **Status** | FIXED |

---

## AUDIT-20260729-008

| Campo | Valor |
|---|---|
| **ID** | AUDIT-20260729-008 |
| **Severidade** | P1 |
| **Reprodução** | Advisor: `auth_leaked_password_protection` WARN |
| **Impacto** | Senhas vazadas não bloqueadas |
| **Causa Raiz** | Proteção HaveIBeenPwned desligada no Auth |
| **Correção** | Ativar no dashboard Supabase Auth (ver `docs/GO_LIVE.md`) |
| **Arquivos alterados** | `docs/GO_LIVE.md` (checklist) |
| **Testes criados** | — |
| **Evidência** | advisor ainda WARN pós-migration (toggle Auth, não SQL) |
| **Status** | BLOCKED_ON_OPS |

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

| Sev | Estado |
|---|---|
| P0 | 001/002 BLOCKED_ON_OPS · 003 MITIGATED/DISK_OPS |
| P1 | 004/005/006/007 FIXED · 008 BLOCKED_ON_OPS (Auth toggle) |
| P2 | 2 OPEN |

Execução: migration `20260730015909_p1_security_revoke_and_rls_tighten` · [`P1_STUDY.md`](P1_STUDY.md)
