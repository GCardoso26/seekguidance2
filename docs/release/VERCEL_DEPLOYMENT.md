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
