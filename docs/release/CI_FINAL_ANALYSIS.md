# CI Final Analysis — RC1 Finalization

**Data:** 2026-07-14  
**Runs analisados:** `29335442834` (CI), `29335443375` (QG), `29335442762` (Security)

## Inventory

| Job / Workflow | Status (após 7d6e32e2) | Nota |
|---|---|---|
| Security Scan / TruffleHog | **PASS** | base=`before` / head=`sha` |
| Lighthouse CI | **PASS** | |
| Checkout Race | **PASS** | |
| Vercel Deploy Hook | **PASS** | |
| Render Deploy Hook | **PASS** | |
| CI / frontend Vitest | **FAIL** | assertion path reexport |
| Quality Gates / Vitest | **FAIL** | mesmo |

## Cause root — Security (pré-fix)

- TruffleHog recebia `base: default_branch` + `head: HEAD` → após push em `main`, BASE==HEAD → exit 1.  
- **Correção:** `base: github.event.before` · `head: github.sha` (PR: base/head sha).  
- **Validação:** run Security Scan **success**.

## Cause root — CI/QG Vitest

- Teste lia `marketplace/checkout/page.tsx` esperando `CheckoutProgressBar`.  
- Página virou reexport → `export { default } from "@/app/checkout/page"`.  
- Progress bar está em `app/checkout/page.tsx` (shell RSC).  
- **Correção:** apontar o teste para `src/app/checkout/page.tsx`.

## Ruff

- Escopo CI: `ruff check app tests evaluation` → **PASS** local após recuperação.  
- Ver `RUFF_FINAL_REPORT.md`.

## Dependências / CodeQL / SARIF

- `npm audit` permanece `continue-on-error` (sem mascara de falha de secrets).  
- CodeQL/SARIF: sem job bloqueante adicional nos workflows RC.

## Próxima validação

Push do commit de teste a11y + busca LCP → CI/QG devem ficar verdes.
