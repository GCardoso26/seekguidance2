# Release Train — JudgeTCG

**Status:** Em vigor (ADR-015)

Separar trens de release evita que feature de negócio espere infra (e vice-versa).

## Trens

| Trem | Conteúdo | Cadência sugerida |
|------|----------|-------------------|
| **Architecture** | ADRs, governance, boundaries, freezes | Sob demanda (RFC) |
| **Infrastructure** | Migrations, workers, Outbox, filas, flags | Contínua / semanal |
| **Business Features** | Checkout, Orders, Notifications, Analytics UI… | Contínua (prioridade) |
| **Hotfix** | Correções urgentes de produção | Imediato |

## Regras

1. Um PR **não** mistura Architecture + Business Feature grandes sem necessidade.
2. Hotfix não carrega refactors.
3. Business Features **não** bloqueiam em “esperar Event Store / mesh / novo BC transversal”.
4. Tags / release notes devem indicar o trem principal (`type: business | infra | architecture | hotfix`).

## Exemplo

- Checkout V1 → **Business Features**
- Nova coluna em `platform.idempotency_keys` → **Infrastructure**
- ADR-016 supersede → **Architecture**
- Corrige double-charge → **Hotfix**
