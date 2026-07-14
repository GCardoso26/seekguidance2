# RC1 Blockers

**Data:** 2026-07-14 (pós deploy production)  
**Escopo:** critérios para **tag** RC1

## Resolvidos

| ID | Was | Resolução | Evidência |
|---|---|---|---|
| Store Perf/LCP lab | 74 / 4.2s | RC1.1 | Lab/docs STORE |
| A11y/BP lab | 96/96 | RC1.2 | Lab 100/100 |
| **PROD-LH Store** | A~93 BP96 Perf~77 | Deploy RC1.1+RC1.2 | Prod `/loja` **P100 A100 BP100 SEO100 LCP 0.7s** |
| Smoke | — | **34/34** | `PRODUCTION_VERIFICATION.md` |
| Health | — | BFF+API **200** | health endpoints |
| Deploy FE | pending | Vercel prod READY | `VERCEL_DEPLOYMENT.md` |

## Abertos (impedem tag)

| ID | Sev | Descrição | Evidência |
|---|---|---|---|
| **PROD-CHECKOUT-PERF** | P0 | `/checkout` Performance **91** (&lt;95) | `PRODUCTION_LIGHTHOUSE.md` |
| **PROD-CHECKOUT-LCP** | P0 | `/checkout` LCP **2.0s** (meta &lt;2s) | idem |
| **CI-API** | P1 | Job `api` / Quality Gates falham (Ruff I001 em testes BE — pré-existente) | GH run `29305641963` / `29305641930` |
| **CI-SECURITY** | P1 | TruffleHog “BASE and HEAD commits are the same” | GH run `29305641956` |
| Busca Perf | P2 | `/loja/busca` Perf **86** (fora da lista Phase 8 crítica, mas medido) | LH prod |

## Status

**RC1 BLOCKED** — **não** “ALL BLOCKERS RESOLVED”.

Store production quality gates (A11y/BP/SEO/Perf/LCP) **PASS**.  
Bloqueio restante: **checkout prod Perf/LCP** + **CI não verde**.
