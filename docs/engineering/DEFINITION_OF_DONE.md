# Definition of Done (DoD) — JudgeTCG

**Status:** Em vigor (ADR-015)  
**Escopo:** Todo PR que altere código de produto ou plataforma

## Checklist obrigatório

Nenhum PR é aceito sem:

| # | Critério | Notas |
|---|----------|--------|
| 1 | **Testes automatizados** | Unit e/ou contrato relevantes ao diff; CI verde |
| 2 | **ADR atualizado** | Se mudança estrutural / fronteira / evento — nova ADR ou referência explícita |
| 3 | **Documentação de API pública** | Se expor comando/query/evento — atualizar `PUBLIC_API_BOUNDARIES.md` e/ou doc do BC |
| 4 | **Eventos versionados** | Novos eventos via `DomainEventFactory` + registro em `EventRegistry` (`.vN`) |
| 5 | **Observabilidade** | Logs/métricas com `requestId` / `correlationId` (e `causationId` quando houver) |
| 6 | **Idempotência** | Se o PR introduz/altera Command Handler — chave de idempotência (ADR-009) |

## Adicional para BCs de negócio (Checkout, Orders, …)

- Consome **somente** interfaces públicas de outros BCs
- Nenhum `SELECT`/`UPDATE` em schema alheio
- Architecture tests (`boundaries.test.ts`) passam
- Feature flag quando o fluxo for canário / parcial

## Não é DoD

- Refatoração “cosmética” sem teste
- Novo worker/componente transversal sem RFC+ADR
- “Depois documentamos”
