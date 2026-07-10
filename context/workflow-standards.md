# Workflow Standards

> Versão: 1.0
>
> Status: Oficial
>
> Precedência: Este documento possui precedência sobre todos os demais documentos da pasta `context/workflows/`.
>
> Todo Workflow do JudgeTCG deve obrigatoriamente seguir os padrões definidos neste documento.

---

# Objetivo

Este documento estabelece o padrão oficial para definição, implementação e evolução de Workflows dentro do JudgeTCG.

Um Workflow representa um processo completo de negócio.

Ele descreve como atores, Aggregates, Bounded Contexts, eventos, políticas e serviços interagem para produzir um resultado consistente.

Workflows não representam telas.

Não representam endpoints.

Não representam CRUDs.

Representam processos de negócio.

---

# Filosofia

No JudgeTCG:

Features implementam Workflows.

Endpoints expõem Workflows.

Application Services executam Workflows.

Aggregates protegem Workflows.

Domain Events propagam Workflows.

Workers continuam Workflows.

Todo código desenvolvido deve existir para suportar um Workflow.

---

# Definição

Um Workflow é a especificação oficial de um processo de negócio.

Exemplos:

Seller Onboarding

Checkout

Pagamento

Envio

Disputa

Review

Reputação

Importação de Expansão

---

# Características

Todo Workflow deve possuir:

- início claramente definido;
- término claramente definido;
- ator responsável;
- Aggregate Root principal;
- contexto de domínio;
- eventos;
- estados;
- regras de negócio;
- compensações;
- observabilidade;
- métricas.

---

# Um Workflow nunca representa

Uma página.

Um Controller.

Um Endpoint.

Uma Query.

Um Repository.

Um Service.

Uma Migration.

Uma tabela.

---

# Estrutura Oficial

Todo Workflow deve seguir exatamente esta estrutura.

---

# Cabeçalho

```text
Nome

Versão

Status

Última atualização

Owner

Bounded Context

Aggregate Root

Domínio
```

---

# 1. Objetivo

Descrição clara do propósito do Workflow.

Uma única responsabilidade.

---

# 2. Escopo

O que faz.

O que não faz.

Limites.

---

# 3. Atores

Identificar todos os participantes.

Exemplo

Seller

Buyer

Administrador

Sistema

Worker

Gateway de Pagamento

Transportadora

---

# 4. Pré-condições

Tudo que precisa existir antes do Workflow iniciar.

Exemplos

Loja aprovada.

Listing publicado.

Pagamento autorizado.

Estoque disponível.

Usuário autenticado.

---

# 5. Gatilho

O que inicia o Workflow.

Exemplos

Clique do usuário.

Webhook.

Evento.

Scheduler.

Worker.

Cron.

---

# 6. Entradas

Commands.

Payload.

Arquivos.

Eventos.

---

# 7. Saídas

DTOs.

Eventos.

Mudanças de estado.

Notificações.

---

# 8. Aggregate Principal

Todo Workflow possui exatamente um Aggregate Root responsável pela consistência.

Exemplos

Order

Listing

Ticket

Store

Payment

Inventory

---

# 9. Bounded Context

Todo Workflow pertence inicialmente a apenas um Contexto.

Exemplo

Marketplace

Order

Payment

Support

Governance

Trust

---

# 10. Fluxo Principal

Descrever todas as etapas.

Exemplo

Criar Pedido

↓

Validar Estoque

↓

Criar Payment Intent

↓

Persistir Pedido

↓

Commit

↓

Emitir Evento

↓

Atualizar Projections

---

# 11. Fluxos Alternativos

Descrever desvios possíveis.

Exemplos

Pagamento recusado.

Timeout.

Cancelamento.

Erro de estoque.

Chargeback.

---

# 12. State Machine

Todo Workflow deve possuir uma máquina de estados.

Formato obrigatório

```text
Estado A

↓

Estado B

↓

Estado C
```

Estados alternativos

Cancelado

Erro

Suspenso

Reprocessando

---

# 13. Regras de Negócio

Todas as regras relevantes.

Cada regra deve possuir identificador.

Exemplo

BR-001

Uma Listing somente pode ser publicada por uma loja aprovada.

---

BR-002

Preço deve ser maior que zero.

---

BR-003

Quantidade deve ser maior que zero.

---

# 14. Permissões

Mapear todas as permissões exigidas.

Utilizar:

permission-matrix.md

Nunca duplicar regras.

---

# 15. Domain Policies

Relacionar todas as Policies utilizadas.

Exemplo

MarketplaceFeePolicy

ShippingPolicy

ReviewPolicy

SellerEligibilityPolicy

---

# 16. Domain Services

Relacionar Services utilizados.

Exemplo

PricingService

ShippingCalculationService

FraudDetectionService

---

# 17. Eventos Emitidos

Listar todos os Domain Events.

Formato

Evento

Descrição

Consumidores

---

Exemplo

listing.created

↓

Search Projection

↓

Analytics

↓

Notifications

---

# 18. Eventos Consumidos

Eventos que iniciam ou continuam o Workflow.

Exemplo

payment.approved

↓

Order Context

---

# 19. Compensações

Toda falha relevante deve possuir estratégia de compensação.

Exemplo

Etiqueta falhou.

↓

Cancelar geração.

↓

Reenfileirar Worker.

---

# 20. Background Processing

Identificar operações assíncronas.

Exemplo

Emails.

Analytics.

Cache.

Projections.

Webhooks.

---

# 21. Integrações

Listar sistemas externos.

Exemplo

Stripe.

Supabase.

Correios.

Melhor Envio.

Cloudflare.

OpenAI.

---

# 22. SLA

Definir tempo esperado.

Exemplo

Pagamento

5 segundos

---

Separação

24 horas

---

Envio

48 horas

---

# 23. Auditoria

Registrar:

Actor

Timestamp

AggregateId

CorrelationId

TransactionId

WorkflowId

Operation

---

# 24. Observabilidade

Todo Workflow deve produzir:

Logs estruturados.

Tracing.

Métricas.

CorrelationId.

RequestId.

WorkflowId.

---

# 25. KPIs

Definir indicadores.

Exemplos

Tempo médio.

Falhas.

Conversão.

Retries.

Cancelamentos.

Tempo de execução.

---

# 26. Anti Patterns

Listar comportamentos proibidos.

Exemplo

Executar HTTP durante Transaction.

Criar Aggregate fora do domínio.

Persistir diretamente pelo Controller.

Executar SQL no Application Service.

---

# 27. Casos Extremos

Descrever Edge Cases.

Exemplos

Duplicidade.

Timeout.

Race Condition.

Webhook duplicado.

Retry.

---

# 28. Implementação Esperada

Todo Workflow deve indicar a arquitetura esperada.

Formato obrigatório.

```text
Controller

↓

Application Service

↓

Repository

↓

Aggregate

↓

Domain Service

↓

Unit Of Work

↓

Outbox

↓

Commit

↓

Event Bus

↓

Workers

↓

Read Models
```

---

# 29. Dependências

Listar documentos relacionados.

Exemplo

business-rules.md

permission-matrix.md

domain-patterns.md

application-services.md

cqrs-pattern.md

transaction-boundaries.md

repository-pattern.md

domain-event-contracts.md

---

# 30. Evolução

Descrever futuras melhorias previstas.

Nunca modificar comportamento atual.

Registrar apenas roadmap.

---

# Convenções

Todos os Workflows devem:

Utilizar Commands.

Utilizar Aggregates.

Utilizar Domain Events.

Utilizar Unit Of Work.

Utilizar CQRS.

Utilizar Outbox Pattern.

Ser Event Driven.

Ser Stateless.

Possuir rastreabilidade completa.

---

# Numeração

Todos os Workflows possuem identificador.

Formato

WF-001

WF-002

WF-003

...

---

Todas as regras possuem identificador.

Formato

BR-001

BR-002

...

---

Todos os KPIs possuem identificador.

Formato

KPI-001

KPI-002

---

Todos os SLAs possuem identificador.

Formato

SLA-001

SLA-002

---

# Responsabilidades

| Camada | Responsabilidade |
|----------|------------------|
| Controller | Receber requisição |
| Application Service | Orquestrar Workflow |
| Aggregate | Garantir invariantes |
| Domain Service | Executar lógica compartilhada |
| Repository | Persistir Aggregate |
| Unit Of Work | Coordenar Transaction |
| Outbox | Persistir eventos |
| Event Bus | Distribuir eventos |
| Worker | Processamento assíncrono |
| Projection | Atualizar leitura |

---

# Princípios Arquiteturais

Todo Workflow deve respeitar obrigatoriamente:

DDD

Clean Architecture

CQRS Lite

Vertical Slice Architecture

Outbox Pattern

Optimistic Concurrency

Repository Pattern

Unit Of Work

State Machines

Event Driven Architecture

---

# Regra Fundamental

Todo comportamento do JudgeTCG deve ser descrito por um Workflow oficial.

Novas funcionalidades não podem ser implementadas diretamente a partir de requisitos, telas ou endpoints.

Toda implementação deve iniciar pela criação ou evolução de um Workflow, que se torna a fonte oficial de verdade para produto, arquitetura, desenvolvimento, testes e operação da plataforma.

Este documento define o padrão obrigatório para todos os Workflows presentes e futuros do JudgeTCG, garantindo consistência, rastreabilidade, escalabilidade e alinhamento entre domínio, código e operação.