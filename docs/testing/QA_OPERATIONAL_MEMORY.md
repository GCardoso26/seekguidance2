# Memória operacional do QA (R4+)

Subsistema de governança alinhado à Platform Constitution: **evidência acumulada**, não North Star.

## Componentes

| Peça | Caminho | Função |
| --- | --- | --- |
| **QA Warehouse** | `testing/history/` | Campanhas imutáveis + `index.json` |
| **Bug Knowledge Base** | `testing/knowledge/bugs.json` | Bugs conhecidos (`BUG-0001`…) |
| **Quality Trends** | `testing/reports/quality-trends.md` | Evolução P0/P1 (regenerável) |
| **Confidence** | consolidado + campanha | PASS/WARN/FAIL + **%** (nunca vs parcial vs total) |
| **FCS** | consolidado + campanha | Feature Coverage — 3º KPI (com TCS/PCS) |
| **Release Readiness** | `testing/reports/release-readiness.md` | Prontidão técnica para próxima validação |

## Comandos

```bash
npm run test:qa:orchestrator   # campanha + arquivo histórico + handoff
npm run test:qa:trends         # só regenera quality-trends.md
```

## Campanha exemplo

```json
{
  "campaignNumber": 1,
  "id": "campaign-001",
  "counts": { "p0": 1, "p1": 2, "p2": 0, "seenAgain": 0 },
  "durationMinutes": 38,
  "environment": "LOCAL",
  "stack": "FAIL",
  "releaseReadiness": { "overall": "NOT READY" }
}
```

## Bug Knowledge Base

Quando Marina, Renato ou outra persona reencontra o mesmo achado:

- **Não** incrementa P0/P1 da campanha outra vez.
- Incrementa `seenAgain` com referência `campaign-027`.
- Handoff lista em **Seen again (KB)**.

Campos: título, primeira/última ocorrência, status (`OPEN`/`CLOSED`), afeta, responsável, arquivos (heurística / manual futuro).

## Confidence

| Level | Significado |
| --- | --- |
| `full` | Automação + status verde |
| `strong` | WARN com boa cobertura |
| `partial` | PASS manual / campanha incompleta |
| `weak` | Stack parcial ou bloqueada |
| `none` | FAIL / blocked |

Ex.: Search **PASS 98%** (Vitest + HTTP) vs Seller **PASS 61%** (stub — campanha parcial).

## FCS (Feature Coverage)

Indicador **exclusivo de funcionalidades** exercitadas na campanha:

Login, Inventory, Listing, Search, Checkout, Reports, Sealed Products, Favorites.

TCS/PCS continuam em `npm run test:coverage`; FCS é calculado no orchestrator.

## Release Readiness

Responde: *a plataforma está tecnicamente pronta para a próxima etapa de validação?*

**Não** substitui MRB, LPC/LCS/SD, nem Go/No-Go de mercado.

## Congelamento de arquitetura QA

Após histórico + KB + confidence + FCS + readiness:

- Novas personas tendem a **sobrepor** responsabilidades.
- Evolução = **enriquecer evidências** por campanha, não multiplicar validadores.
- Mesmo nível de governança que Providers (R2), Ops (R3), Constitution (R4).

Ver também: [QA_ORCHESTRATOR.md](./QA_ORCHESTRATOR.md), [PERSONA_VALIDATION_PIPELINE.md](./PERSONA_VALIDATION_PIPELINE.md).
