# P1_STUDY — 2026-07-30 (pós-validação P0)

Evidência fresca após deploy `c0c04b2c`. Hierarquia: Constitution → ADRs → North Star. Só problemas **observados**.

## Contexto P0 (fechamento parcial)

| Check | Resultado |
|---|---|
| `GET /v1/health` gitCommit | `c0c04b2c…` |
| `go_live_blockers` | presente: payments_misconfigured, melhor_envio_disabled, sentry_disabled |
| `database` | ok · `asset_version_history` = 364597 rows |
| `uq_asset_version` logs | burst ~2026-07-29 22:43Z; sem novos no slice recente de checkpoints |
| Pagamentos / frete | ainda BLOCKED_ON_OPS |

## Ranking P1

| Rank | ID | Veredito | Natureza | Próxima ação |
|---|---|---|---|---|
| 1 | **006** | OPEN | Ataque: SECURITY DEFINER + EXECUTE anon/authenticated em `handle_new_user_google_confirm`, `rls_auto_enable` | Migration `REVOKE EXECUTE … FROM anon, authenticated`; auditar corpos |
| 2 | **007** | OPEN | Abuso: RLS INSERT always-true em `analytics_events`, `newsletter_subscribers` | Restringir WITH CHECK + rate limit / captcha se público |
| 3 | **008** | OPEN | Auth: HaveIBeenPwned off | Toggle no dashboard Supabase Auth (ops, 1 clique) |
| 4 | **005** | OPEN → **TEST_DRIFT** | Vitest 5 fail / 473 pass — todos drift de contrato | Atualizar testes (não hotfix produto) |
| 5 | **004** | FIXED (watch) | Race version — código no API; workers compartilham Dockerfile | Monitorar próximo cron sealed/accessories |

## Detalhe 005 (vitest 2026-07-30)

| Teste | Drift | Fix sugerido |
|---|---|---|
| seller-plans limite 50 | sandbox eleva limite no Vitest | mock `canElevateSandbox=false` |
| tcg-logos length 14 | ADR-016 → 11 jogos | `toHaveLength(11)` |
| CardCard “Ver” mobile | seletor aria antigo | `/^Ver$/` ou aria-label |
| SellerOffersTable empty | copy novo | `pdp-no-offers` / `/sem ofertas/` |
| GameSelector radiogroup | aria-label novo | `/Todos os jogos no mercado/` |

Severidade cliente: **nula/baixa** — CI confidence, não regressão de compra.

## Fora de escopo desta rodada

- Flip PIX / Melhor Envio (P0 ops)
- Upgrade plano disco Supabase (P0 ops)
- P2 performance advisors (auth_rls_initplan)

## Execução 2026-07-30

| ID | Resultado |
|---|---|
| 006 | FIXED — REVOKE aplicado em prod; anon/auth EXECUTE=false |
| 007 | FIXED — DROP insert policies; advisors always_true=0 |
| 008 | BLOCKED_ON_OPS — checklist em `docs/GO_LIVE.md` (toggle Auth) |
| 005 | FIXED — 5 arquivos vitest 19/19 + aria-label CardCard |
| 004 | FIXED (watch) |

Migration: `supabase/migrations/20260730015909_p1_security_revoke_and_rls_tighten.sql`
