# Vercel Deployment — RC1

**Data:** 2026-07-14  
**Projeto:** `project-eye28` (team `guilhermebcardoso13-1626s-projects`)  
**Target:** **Production** (não Preview)

## Deployment

| Campo | Valor |
|---|---|
| Deployment ID | `dpl_85fQfyC21x1kipBK1nC14P18EG1D` |
| URL | https://project-eye28-gi2knlbs2-guilhermebcardoso13-1626s-projects.vercel.app |
| Inspector | https://vercel.com/guilhermebcardoso13-1626s-projects/project-eye28/85fQfyC21x1kipBK1nC14P18EG1D |
| readyState | **READY** |
| Aliases | `https://judgetcg.com.br`, `https://www.judgetcg.com.br` |
| Método | `vercel deploy --prod --yes --archive=tgz` (cwd monorepo) |
| Build | success (~16m wall / ~6m build) |
| Rollback ativo | **Não** |

## Relação com commits RC

| Commit | Hash |
|---|---|
| RC1.1 | `4c40155f` |
| RC1.2 (HEAD main) | `bb659d93` |

Também houve **Vercel Deploy Hook** CI success no push (`29305641946`).

## Verificações pós-alias

| Check | Resultado |
|---|---|
| `GET https://judgetcg.com.br/` | **200** |
| `GET https://judgetcg.com.br/loja` | **200** |
| `GET https://judgetcg.com.br/logos/mtg.webp` | **200** (~2.3 KB) |
| Assets WebP na `/loja` | **sim** (refs `.webp` no HTML) |

## Gate de deploy (obrigatório)

O workflow [`.github/workflows/vercel-deploy-hook.yml`](../../.github/workflows/vercel-deploy-hook.yml) só dispara production **depois** do job `frontend-quality` (lint, type-check, Vitest, `ds:audit`, build).

### Checklist operacional (owner — GitHub UI)

O workflow **não** cria branch protection. Configurar manualmente:

1. GitHub → Settings → Branches → Branch protection rule em `main`
2. Enable **Require status checks to pass before merging**
3. Adicionar check requerido: **`frontend-quality`** (do workflow Vercel Deploy Hook e/ou Quality Gates)
4. Não marcar checks de API/`ruff` como required para merge de PRs só-FE (path-filters já skipam jobs irrelevantes)

Falhas de API **não** bloqueiam o deploy do frontend quando o push toca só `frontend/runtime_console_v3/**`.
