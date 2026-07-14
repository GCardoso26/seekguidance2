# Security Scan Recovery — RC1 Final

**Data:** 2026-07-14

## Falha

TruffleHog GitHub Action:

> BASE and HEAD commits are the same

Com `base: default_branch` e `head: HEAD` em push para `main`, após checkout os dois refs coincidem → scan aborta com exit 1.

## Correção

`.github/workflows/security-scan.yml`:

```yaml
base: ${{ github.event.pull_request.base.sha || github.event.before }}
head: ${{ github.event.pull_request.head.sha || github.sha }}
extra_args: --only-verified
```

## Dependências

`npm audit --audit-level=moderate` permanece `continue-on-error: true` (já existente) — sem remediação agendada nesta RC (sem CVE crítica forçada no gate).

## Validação

GH run **Security Scan** `29335442762` → **success** (1m12s).
