# QA Orchestrator (R4)

Coordena **automaticamente** as oito personas permanentes e produz handoff mínimo para o Cursor.

## Fluxo

```text
QA Orchestrator
        ↓
Ricardo (Environment Audit)
        ↓
Smoke
        ↓
Marina (Seller)
        ↓
Carlos (Buyer)
        ↓
Fernanda (Marketplace)
        ↓
Juliana (UX)
        ↓
Eduardo (Search)
        ↓
Daniela (Catalog)
        ↓
Renato (Performance)
        ↓
Merge dos relatórios
        ↓
Consolidação automática
        ↓
MRB → Cursor (somente evidência)
```

## Comando

```bash
npm run test:qa:orchestrator
```

## Saídas

| Artefato | Caminho |
| --- | --- |
| Environment Audit | `testing/reports/environment-audit-latest.json` |
| Persona (cada uma) | `testing/reports/persona-<id>-latest.json` |
| Consolidação | `testing/reports/qa-campaign-consolidated.json` |
| Handoff Cursor | `testing/reports/qa-cursor-handoff.md` |
| Release Readiness | `testing/reports/release-readiness.md` |
| Quality Trends | `testing/reports/quality-trends.md` |
| **Histórico imutável** | `testing/history/campaign-NNN.json` + `index.json` |
| Bug Knowledge Base | `testing/knowledge/bugs.json` |

Memória operacional: [QA_OPERATIONAL_MEMORY.md](./QA_OPERATIONAL_MEMORY.md).

O handoff inclui: P0/P1/P2 **novos**, seen again (KB), confidence, FCS, release readiness, regressões, arquivos, prompt, testes e aceite.

```bash
npm run test:qa:trends   # regenerar gráficos/tabelas de tendência
```

## Variáveis

| Variável | Default | Efeito |
| --- | --- | --- |
| `ORCHESTRATOR_STOP_ON_FAIL` | `1` | Para após audit ou smoke falhar |
| `ORCHESTRATOR_SKIP_GATES` | `0` | Omitir smoke (não recomendado) |
| `RENATO_SCALE` | `1` | Escala da carga leve do Renato |
| `BASE_URL` | `http://localhost:3000` | Alvo HTTP (Eduardo, Renato, audit) |

## Disciplina (Platform Constitution)

- Nenhuma persona altera métricas North Star.
- Nenhuma persona executa seeds em Beta.
- Marina / Carlos / Fernanda: campanhas funcionais **manual ou Playwright supervisionado** (stubs registram estado).
- Juliana: automação parcial (estrutura a11y) + browser na campanha média.
- Eduardo / Daniela / Renato: mix de testes Vitest + HTTP leve.
- **Sem stress test** — Renato usa carga leve com P95/P99, não saturar produção.

## Personas

Detalhes por papel: [personas/README.md](./personas/README.md)

Pipeline humano: [PERSONA_VALIDATION_PIPELINE.md](./PERSONA_VALIDATION_PIPELINE.md)
