# CI Modernization — GitHub Actions (2026)

**Data:** 2026-07-13  
**Escopo:** somente `.github/workflows/**` (+ validador `scripts/ci_modernization_dry_run.py`)  
**Fora de escopo:** regras de negócio, APIs, frontend, backend de produto

## Objetivo

Alinhar os 16 workflows ao estado recomendado para GitHub Actions em 2026 (Node 24 nas actions JS; toolchains Node 22 LTS / Python 3.13).

## Versões das actions (após)

| Action | Antes (típico) | Depois |
|---|---|---|
| `actions/checkout` | v4 | **v6** |
| `actions/setup-node` | v4 | **v6** |
| `actions/setup-python` | v5 | **v6** |
| `actions/upload-artifact` | v4 | **v7** |
| `actions/github-script` | v7 | v7 (sem major mais recente estável no escopo) |
| `docker/setup-buildx-action` | v3 | v3 (+ GHA cache no build-push) |
| `docker/build-push-action` | v6 | v6 |
| `slackapi/slack-github-action` | v1.27.0 | v1.27.0 (mantido — evitar breaking do v2 sem validação Slack) |
| `trufflesecurity/trufflehog` | @main | @main |

## Toolchains

| Runtime | Antes | Depois |
|---|---|---|
| Node (app CI) | 20 em mobile/LH-comment; 22 no restante | **22** em todos os jobs Node |
| Python | 3.11 / 3.12 | **3.13** em todos os jobs Python |

## Padronizações

1. **Cache**
   - `setup-node`: `cache: npm` + `cache-dependency-path: package-lock.json` (lockfile raiz do monorepo)
   - `setup-python`: `cache: pip` + `cache-dependency-path` quando há `requirements.txt`
   - Docker builds: `cache-from` / `cache-to: type=gha`

2. **`NODE_OPTIONS=--max-old-space-size=8192`**
   - Jobs: `ci.yml` frontend, `quality-gates` frontend, `lighthouse.yml`, `lighthouse-comment.yml`, `playwright.yml` (build Next), `vercel-deploy-hook.yml`

3. **`timeout-minutes: 30`**
   - Aplicado a todos os jobs com execução de steps GitHub Actions
   - **Exceção:** `catalog-sync.yml` permanece **120** (sync multi-jogo com sleep; documentado)
   - **Exceção condicional:** `load-test.yml` → 90 se `full_load=true`, senão 30

4. **Depreciações removidas / evitadas**
   - Pins `@v4` checkout / setup-node e `@v5` setup-python substituídos
   - `upload-artifact@v4` → `@v7` (compatível Node 24 nas actions JS)
   - Paths de cache inconsistentes (`frontend/.../package-lock.json` vs root) unificados para o lockfile raiz onde o monorepo usa `npm ci` na raiz

## Workflows alterados (16)

| Workflow | Mudanças principais |
|---|---|
| `ci.yml` | checkout/setup v6; Python 3.13; mobile Node 22; timeouts |
| `quality-gates.yml` | idem + Python 3.13 |
| `playwright.yml` | v6/v7; NODE_OPTIONS; npm ci na raiz; timeout |
| `lighthouse.yml` | v6/v7; NODE_OPTIONS; timeout |
| `lighthouse-comment.yml` | Node 22; v6; NODE_OPTIONS; timeout |
| `smoke-test.yml` | Python 3.13; v6/v7; timeout 30; pip cache |
| `security-scan.yml` | v6; timeout |
| `checkout-race.yml` | v6; Python 3.13; timeout |
| `judge-evaluation.yml` | v6/v7; Python 3.13; timeout |
| `load-test.yml` | checkout v6; upload v7; timeout dinâmico |
| `aws-platform-build.yml` | checkout v6; GHA docker cache; timeout |
| `catalog-health-ping.yml` | timeout 30 (era 2) |
| `catalog-sync.yml` | timeout 120 mantido (exceção) |
| `expire-checkouts.yml` | timeout 30 |
| `render-deploy-hook.yml` | timeout 30 |
| `vercel-deploy-hook.yml` | checkout/setup-node v6; Node 22; NODE_OPTIONS; timeout |

## Dry-run

Validador local:

```bash
python scripts/ci_modernization_dry_run.py
```

**Resultado (2026-07-13):** `errors: 0` — 16 YAMLs parseados; nodes=`22`; pythons=`3.13`; sem pins stale `@v4`/`setup-python@v5`/`upload-artifact@v4`.

> Nota: execução real nos runners GitHub permanece sujeita ao **billing / spending limit** (blocker RC1 B1). Esta sprint não contorna billing.

## Riscos

| Risco | Mitigação |
|---|---|
| Python 3.13 incompatível com alguma dep | Suite API já verde em 3.11/local; monitorar primeiro CI verde pós-billing |
| `upload-artifact@v7` mudanças de archive | Defaults preservam zip (`archive` default true) |
| Timeout 30 em jobs longos | catalog-sync e load full mantêm exceções |
| Slack action | Mantida em v1.27.0 de propósito |
| Billing Actions | Externamente bloqueado — modernização não exige run verde para ser válida sintaticamente |

## Compatibilidade GitHub Actions 2026

- Actions oficiais atualizadas para majors com runtime **Node 24** (checkout v6, setup-node v6, setup-python v6, upload-artifact v7).
- Alinha com a janela pós–16/06/2026 em que runners defaultam Node 24 para actions JS e descontinuam Node 20 no outono/2026.
- Toolchain da **aplicação** permanece **Node 22 LTS** (pedido do sprint) e **Python 3.13**.

## O que não foi alterado

- Código de produto (frontend/backend/API/Domínio)
- Secrets, ambientes Render/Vercel (exceto pins de actions no workflow Vercel)
- Lógica de testes / cron payloads / deploy hooks (apenas envelope CI)
