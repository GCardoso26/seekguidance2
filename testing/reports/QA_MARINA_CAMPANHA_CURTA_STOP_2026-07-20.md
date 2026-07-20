# Relatório de Campanha — Marina Costa (STOP)

**Persona:** Marina Costa · Senior Functional QA + Marketplace Vendor  
**Pergunta única:** *Um lojista real conseguiria utilizar o JudgeTCG hoje durante um dia inteiro de trabalho?*  
**Resposta:** **NÃO.**  
**Campanha:** Curta (20–30 min) — gates obrigatórios  
**Data:** 2026-07-20  
**Motivo de parada:** **Stack indisponível** (Smoke FAIL) — critério de STOP acionado  

> Não continuei a jornada. Não mascarei a falha. Não usei `SMOKE_SOFT`. Não assumi Redis/Search/API “de passagem”.

---

## Executive Summary

| Item | Resultado |
| --- | --- |
| Constitutuição / ADRs / North Star / Testing Arch | **Lidos / respeitados** (gates documentais) |
| Environment Guard | **PASS** — `env=local` |
| Smoke (FE health + search Rapunzel) | **FAIL** — `localhost:3000` sem resposta |
| Login | **NÃO EXECUTADO** (bloqueado pelo Smoke) |
| Jornada seller/buyer/inventário/checkout/relatórios | **NÃO EXECUTADO** |
| North Star LPC/LCS | **Não tocados** (correto) |

**Veredito operacional:** sem FE respondendo em `BASE_URL`, um lojista **não abre a loja**. Dia de trabalho = impossível nesta sessão.

---

## Gate sequence (obrigatória)

| # | Gate | Resultado | Evidência |
|---|------|-----------|-----------|
| 1 | Platform Constitution | OK (referência) | `docs/architecture/PLATFORM_CONSTITUTION.md` |
| 2 | ADRs | OK (referência) | ADR-012/013/014 vigentes; não alterados |
| 3 | North Star R1 | OK (não alimentar) | LPC/LCS fora de escopo de teste |
| 4 | Testing Architecture | OK | Personas/smoke só local/CI; sem Beta |
| 5 | Environment Guard | **PASS** | `assert-not-beta.mjs smoke` → `env=local` |
| 6 | Smoke | **FAIL → STOP** | ver abaixo |
| 7 | Login | **SKIP** | regra: não continuar após falha |
| 8+ | Funcionais | **SKIP** | — |

---

## Evidência do STOP — Smoke

**Passo:** `npm run test:smoke` (BASE_URL default `http://localhost:3000`)  

**Esperado:** pelo menos um de `/health` ou search Rapunzel em 2xx/3xx  

**Obtido:**

```json
{
  "base": "http://localhost:3000",
  "healthOk": false,
  "searchOk": false,
  "results": [
    { "url": ".../api/health", "status": 0, "error": "fetch failed" },
    { "url": ".../health", "status": 0, "error": "fetch failed" },
    { "url": ".../cards?q=Rapunzel", "status": 0, "error": "fetch failed" },
    { "url": ".../search?q=Rapunzel", "status": 0, "error": "fetch failed" },
    { "url": ".../cards", "status": 0, "error": "fetch failed" }
  ]
}
```

| Campo | Valor |
| --- | --- |
| URL | `http://localhost:3000` |
| Persona | Marina Costa |
| Jogo | N/A (pré-jornada) |
| Browser | N/A (HTTP smoke) |
| Screenshot | N/A (sem UI) |
| Console | N/A |
| Network | connection refused / fetch failed |
| Stacktrace | Node fetch failed |
| Severidade | **P0 — Stack indisponível** |
| ADR impactado | ADR-014 (ambiente de teste válido, mas alvo offline) |
| North Star impactado | Nenhum dado gerado; **loop LPC impossível sem FE** |
| Possível causa | Runtime Console / Next não iniciado; `BASE_URL` não apontando para staging |
| Sugestão | Subir FE local **ou** fornecer `BASE_URL` de staging autorizado; reexecutar Campanha Curta do gate Smoke |

### Portas locais (não assumidas — medidas)

| Porta | Serviço típico | Listening |
| --- | --- | --- |
| 3000 | FE Next | **False** |
| 3001 | FE alt | False |
| 5432 | Postgres | True |
| 6379 | Redis | True |
| 8000 | API alt | False |
| 8080 | desconhecido | True |
| 9200 | OpenSearch | **False** |

**Interpretação Marina:** “Tem banco e Redis na máquina, mas a loja (site) está fechada. Search (9200) também não responde. Eu não consigo trabalhar.”

Redis **listening ≠ Redis funcionando para a app**. Search **não validado**. Projection **não validada**. Upload/Images **não validados**.

---

## Market Readiness

| Dimensão | Nota | Comentário |
| --- | --- | --- |
| Market Readiness | **0 / 10** | Sem FE, sem smoke de busca |
| Seller Readiness | **0 / 10** | Login não alcançado |
| Buyer Readiness | **0 / 10** | Search indisponível no smoke |
| Provider Readiness | **N/D** | Não avaliado operacionalmente nesta campanha |
| Search | **FAIL** | Smoke search fail |
| Checkout | **N/D** | STOP antes |
| Inventory | **N/D** | STOP antes |
| Reports | **N/D** | STOP antes |
| Performance | **N/D** | STOP antes |
| UX / Visual / A11y | **N/D** | STOP antes |

---

## Top bugs (esta campanha)

### 1. [P0] FE/stack smoke offline — STOP

- **Passo:** Smoke health/search  
- **Esperado:** 2xx  
- **Obtido:** status 0 fetch failed  
- **URL:** `http://localhost:3000/*`  
- **Persona:** Marina Costa  
- **Severidade:** P0  
- **ADR:** ADR-014  
- **North Star:** impede qualquer prova de liquidez nesta sessão  
- **Causa provável:** processo Next não rodando / BASE_URL errado  
- **Sugestão:** iniciar `runtime_console_v3` + API; ou `BASE_URL=<staging>` autorizado  
- **Prompt Cursor:** ver § abaixo  

*(Demais Top 20 de campanhas anteriores / código **não** reabertos aqui — regra: sem evidência desta campanha, não inventar.)*

---

## Top 20 Quick Wins / Melhorias / Arquivos

**Nesta campanha:** lista vazia de quick wins de produto — **único win operacional** é restaurar o alvo Smoke.

| Prioridade | Ação | Rollback |
| --- | --- | --- |
| P0 | Disponibilizar FE+health+search em URL testável (local ou staging) | Parar processos / limpar BASE_URL |
| P0 | Reexecutar Campanha Curta do zero (gates → smoke → login → Lorcana) | — |

Arquivos afetados por correção de ambiente: **nenhum de produto** até o stack subir. Ops: `testing/smoke/smoke-readonly.mjs` (já correto ao falhar).

---

## Critério de parada — checklist

| Critério | Acionado? |
| --- | --- |
| Stack indisponível | **SIM** |
| Falha de autenticação | N/A |
| Search indisponível | **SIM** (smoke) |
| Redis indisponível | Não afirmado (porta 6379 up; app não validada) |
| Projection indisponível | Não medido (OpenSearch 9200 down) |
| Migration pendente | Não medido |
| Guard Beta | Não |
| Ambiente incorreto | Não (local OK) |

---

## Prompt Cursor (apenas desbloqueio operacional — sem feature)

```text
Platform Guardian / ops — NÃO alterar ADRs, North Star, Bounded Contexts.

Problema evidenciado pela persona Marina Costa (Campanha Curta STOP):
npm run test:smoke falha em http://localhost:3000 (fetch failed).
Porta 3000 fechada; 9200 fechada; 6379/5432 abertas.

Tarefa:
1) Documentar ou scriptar "como subir FE+API+search para smoke local"
   em docs/testing ou testing/README (runbook curto).
2) NÃO adicionar SMOKE_SOFT=1 como default.
3) NÃO contornar o gate.
4) Opcional: script testing/smoke/preflight.mjs que imprime portas
   3000/6379/9200/API antes do smoke e exit 1 com mensagem clara.

Validação: com stack no ar, `npm run test:smoke` deve passar;
depois Marina retoma Campanha Curta no Login.
Rollback: remover script/doc se inútil.
```

---

## Próxima campanha (humana)

1. Subir stack **local** ou informar `BASE_URL` de **staging** (nunca Beta/Prod).  
2. Reexecutar: Guard → Smoke → Login → jornada Lorcana (Campanha Curta).  
3. Só então Campanha Média (multi-jogo).

---

**Assinatura:** Marina Costa · Campanha Curta · **STOP — Stack indisponível** · 2026-07-20  

**Arquivo:** `testing/reports/QA_MARINA_CAMPANHA_CURTA_STOP_2026-07-20.md`

---

## Ready To Resume

Use o checklist gerado pelo SRE (atualize com `npm run test:audit`):

```bash
npm run test:audit
# → testing/reports/environment-audit-latest.md
```

Depois:

```bash
npm run test:campaign:gates
```

↓ Retomar a partir do **Login** (Marina Costa).

Ver: [ENVIRONMENT_AUDIT.md](../../docs/testing/ENVIRONMENT_AUDIT.md) · [PERSONA_VALIDATION_PIPELINE.md](../../docs/testing/PERSONA_VALIDATION_PIPELINE.md)
