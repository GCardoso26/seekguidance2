# Technical Debt Register

**Status:** Documento vivo  
**Tipo:** Registro de débitos **aceitos temporariamente** — **não** é backlog, **não** é lista de issues do GitHub  
**Data:** 2026-07-20  
**Relaciona:** [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md) · [FOUNDATION_FREEZE.md](./FOUNDATION_FREEZE.md) · [OPS_REPORTS.md](../operations/OPS_REPORTS.md)

> Débitos de validação de produto (UI/auth/analytics) continuam em [`docs/validation/TECH_DEBT.md`](../validation/TECH_DEBT.md).  
> Este registro cobre **plataforma / arquitetura / ops** que a Constituição congela mas ainda não removeu.

---

## Como usar

| Campo | Significado |
| --- | --- |
| **Debt** | Nome curto e estável |
| **Status** | `Aceito` · `Em remoção` · `Removido` |
| **Motivo** | Por que foi aceito agora |
| **Impacto** | Baixo · Médio · Alto |
| **Critério para remoção** | Condição objetiva (não “quando der”) |
| **Owner** | Quem revisa no MRB |

Atualizar neste arquivo quando o status mudar. Não abrir issue só para “lembrar” — o registro **é** a memória.

---

## Registro ativo

### TD-001 — Dual Stack Python / TS Checkout

| Campo | Valor |
| --- | --- |
| Status | **Aceito** |
| Motivo | API HTTP Python e workers/domínio TS coexistentes; unificação prematura atrasa Beta |
| Impacto | Médio |
| Critério para remoção | Checkout unificado sob um contrato único documentado + ADR se mudar SoT |
| Owner | Platform / Checkout |

### TD-002 — Placeholders Marketplace Coverage

| Campo | Valor |
| --- | --- |
| Status | **Aceito** |
| Motivo | Ops Framework R3 precisa de schema; mercado real ainda não alimenta warehouse |
| Impacto | Baixo (ops) — **Alto** se confundido com North Star |
| Critério para remoção | Após Beta com snapshot real em `marketplaceCoverage` / seller-buyer (`source ≠ placeholder`) |
| Owner | Ops / MRB |

### TD-003 — Shadow Metrics / Certification incompleta (MTG)

| Campo | Valor |
| --- | --- |
| Status | **Aceito** |
| Motivo | Scryfall em SHADOW; FAIL documentado (DFC, etched, collector #, exit gate) |
| Impacto | Médio (bloqueia LIVE) |
| Critério para remoção | Após **MTG LIVE** com certification PASS + SHADOW exit gate assinado |
| Owner | Catalog / Providers |

### TD-004 — Pokémon dataset seed / rollout OFF

| Campo | Valor |
| --- | --- |
| Status | **Aceito** |
| Motivo | Código Implemented; sync OFF até gate Scryfall estável (ADR-006 / ADR-013) |
| Impacto | Médio |
| Critério para remoção | Dataset além do seed + certification SHADOW → Canary conforme Playbook |
| Owner | Catalog / Providers |

### TD-005 — Ops Health / Maturity sem warehouse

| Campo | Valor |
| --- | --- |
| Status | **Aceito** |
| Motivo | Ecosystem Health e Maturity Index usam templates até evidência de campo |
| Impacto | Baixo |
| Critério para remoção | Market Readiness e coverage alimentados por evidência MRB (Evidence Release) |
| Owner | Ops |

### TD-006 — Débitos aceitos no Foundation Freeze

| Campo | Valor |
| --- | --- |
| Status | **Aceito** (legado documentado) |
| Motivo | Ver tabela em [FOUNDATION_FREEZE.md](./FOUNDATION_FREEZE.md) §1 |
| Impacto | Variável |
| Critério para remoção | Por item na freeze doc (Outbox path, etc.) |
| Owner | Platform |

---

## Removidos

| ID | Removido em | Nota |
| --- | --- | --- |
| — | — | (nenhum ainda neste registro) |

---

## Ritual

No MRB / Founder Report:

1. Listar débitos **Aceito** com impacto Médio/Alto.
2. Confirmar se o critério de remoção ainda é válido.
3. Se um débito “virou permanente” sem critério → **violação da Constituição** → ADR ou plano de remoção.
