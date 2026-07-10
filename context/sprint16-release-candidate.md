# Sprint 16 — Release Candidate Hardening

**Versão:** 1.0  
**Status:** Em progresso  
**Última atualização:** 2026-07-10

## Objetivo

Endurecer entregas da Sprint 15 até Release Candidate. Sem novos bounded contexts, sem features de produto — apenas validação, qualidade, acessibilidade, performance e release readiness.

## Runbook RC — status (seções 0–7)

### 0) Pré-requisitos

| Item | Status | Evidência |
|------|--------|-----------|
| CI verde no `d3c906b4` | **Bloqueado** | [CI run 29064152758](https://github.com/GCardoso26/seekguidance2/actions/runs/29064152758) — billing GitHub Actions |
| Build com `NODE_OPTIONS=--max-old-space-size=8192` | **OK** | `npm run build` local passou (2026-07-10) |
| Acesso admin Vercel / Render | **Pendente** | Configurar env vars staging |
| Dashboard telemetria | **Pendente** | — |
| Plantão canary | **Pendente** | — |

**Bloqueador API corrigido:** `IndentationError` em `main.py` (routers buyer/seller) — corrigido; `pytest tests/test_health.py` verde.

### 1) Flags staging

Pendente deploy manual. Verificação pós-ativação: `GET /v1/health` (`features.shipping_v2`) e `GET /api/health` (`features.wishlist_v2`, `features.shipping_v2`).

### 2–4) Smoke / Canary

Não iniciado — aguarda staging com flags. SHIPPING_V2 canary só após WISHLIST_V2 estável.

### 5) Lighthouse

Pendente pós-deploy staging. Workflow também bloqueado por billing ([run 29064152728](https://github.com/GCardoso26/seekguidance2/actions/runs/29064152728)).

### 6–7) Checklist / Go-No-Go

**No-Go** — smoke staging não executado; canary não em 100%; sem sign-off.

## Definition of Done (RC)

| Critério | Status |
|----------|--------|
| Migração Sprint 15 em staging | Aplicada (prod Supabase) |
| SHIPPING_V2 staging validado | Documentado — ativar env |
| WISHLIST_V2 canary produção | Pendente rollout |
| CI pipeline único verde | Implementado — **CI bloqueado por billing GitHub** |
| Type-check sem erros legados | Corrigido |
| WCAG AA fluxos buyer | Parcial — testes estruturais + SkipToMain |
| Image Health Dashboard | Implementado |
| Performance budgets | Cache listings + virtual scroll existente |
| Release notes + changelog | Publicados em `docs/` |
| Checklist release 100% | Em andamento |

## Épicos

1. **Staging Rollout** — `docs/sprint16/STAGING_ROLLOUT.md`
2. **CI / Quality Gates** — `.github/workflows/quality-gates.yml`, `ci.yml` atualizado
3. **Accessibility** — `SkipToMain`, testes `tests/a11y/buyer-flows-structure.test.ts`
4. **Image Health** — `/admin/catalog/image-health`, `image_health_service.py`
5. **Performance** — cache BFF products, Node 22 + 8GB CI
6. **ISR/Cache** — `s-maxage` em listings API
7. **DND Wishlist** — BFF reorder + hook (UI drag opcional pós-beta)
8. **Documentação** — este arquivo + changelog
9. **Release Readiness** — `docs/RELEASE_NOTES_PUBLIC_BETA.md`

## Feature flags — estado alvo

| Flag | Fim Sprint 16 |
|------|----------------|
| `WISHLIST_V2` | Canary produção |
| `SHIPPING_V2` | Staging validado |
| `SHIPPING_V2_ENABLED` | Staging validado |

## Fora de escopo

- Product Intelligence Context
- International Marketplace
- Public APIs
- Native Mobile Apps
- Novos bounded contexts

## Referências

- `context/projeto-contexto-completo-sprint15.md`
- `context/11- release/release-checklist.md`
- `docs/CHANGELOG_PUBLIC_BETA.md`
