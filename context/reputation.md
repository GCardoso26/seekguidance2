# Reputation Workflow

> Workflow ID: WF-009
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Reputation Context
>
> Aggregate Root: Reputation
>
> Bounded Context: Reputation
>
> Dependências:
>
> - order-lifecycle.md
> - payment.md
> - refunds.md
> - disputes.md
> - moderation.md
> - business-rules.md
> - domain-event-contracts.md
> - cqrs-pattern.md
> - unit-of-work.md
> - transaction-boundaries.md

---

# Objetivo

O Reputation Workflow é responsável por calcular continuamente o nível de confiança de compradores e vendedores dentro do JudgeTCG.

A Reputation representa uma projeção derivada do histórico operacional da plataforma.

Ela nunca é editada manualmente.

Ela nunca depende exclusivamente de Reviews.

Ela é construída por eventos de domínio.

---

# Filosofia

Eventos acontecem.

↓

Workers processam.

↓

Reputation recalcula.

↓

Projeções atualizam.

↓

Marketplace utiliza Reputation.

---

# Escopo

## Inclui

Score de vendedores.

Score de compradores.

Trust Score.

Performance.

Histórico.

SLA.

Qualidade operacional.

Fraude.

Disputas.

Reviews.

Confiabilidade.

---

## Não inclui

Reviews.

Tickets.

Pagamentos.

Orders.

Moderação.

---

# Fontes da Reputation

A Reputation deve considerar múltiplos sinais.

## Comerciais

OrdersCompleted

OrdersCancelled

SalesVolume

AverageTicket

Tempo de atividade

---

## Operacionais

Tempo de postagem.

Tempo de entrega.

Atrasos.

Pedidos enviados.

Pedidos extraviados.

---

## Financeiros

Refunds.

Chargebacks.

Fraudes.

Tentativas de fraude.

Pagamentos recusados.

---

## Atendimento

Tickets.

Tempo médio de resposta.

Disputas.

Disputas perdidas.

Disputas vencidas.

---

## Comunidade

Reviews.

Likes.

Feedbacks.

Denúncias.

---

## Compliance

Advertências.

Suspensões.

Banimentos.

Violação de políticas.

---

# Atores

Buyer

Seller

Marketplace

Workers

Sistema

Moderadores

---

# Pré-condições

Eventos publicados.

Projection disponível.

Store existente.

Player existente.

---

# Gatilhos

OrderCompleted

RefundSucceeded

DisputeResolved

ReviewCreated

ModerationDecision

ChargebackOpened

FraudDetected

---

# Entradas

EntityId

EntityType

EventType

Timestamp

CorrelationId

Payload

---

# Saídas

Reputation recalculada.

Eventos.

Atualização Dashboard.

Atualização Ranking.

Atualização Pesquisa.

---

# Aggregate Principal

Reputation

Responsável por:

- Trust Score.

- Histórico.

- Snapshot.

- Auditoria.

- Estado reputacional.

---

# Fluxo Principal

Evento publicado.

↓

Worker consome.

↓

Carregar Reputation.

↓

Aplicar regras.

↓

Recalcular Score.

↓

Persistir.

↓

Commit.

↓

Emitir ReputationUpdated.

↓

Atualizar projeções.

---

# Fluxos Alternativos

## Evento duplicado

Ignorar.

---

## Evento inválido

Registrar.

↓

Descartar.

---

## Projection atrasada

Retry.

---

## Store suspensa

Reputation congelada.

---

# Modelo de Score

A Reputation é composta por múltiplos componentes.

```text
Trust Score

=

Sales Score

+

Delivery Score

+

Quality Score

+

Community Score

+

Compliance Score

-

Fraud Penalty

-

Refund Penalty

-

Dispute Penalty
```

Cada componente possui pesos configuráveis.

Nenhum peso é hardcoded.

Todos são parametrizados.

---

# State Machine

```text
Calculating

↓

Updated
```

Estados alternativos

```text
Frozen

Rebuilding

Invalid
```

---

# Regras de Negócio

## BR-001

Reputation nunca é editada manualmente.

---

## BR-002

Reviews nunca determinam Reputation sozinhas.

---

## BR-003

Todo cálculo deve ser reproduzível.

---

## BR-004

Todos os pesos devem ser configuráveis.

---

## BR-005

Eventos duplicados nunca alteram Score.

---

## BR-006

Store suspensa possui Reputation congelada.

---

## BR-007

Fraudes possuem maior peso negativo.

---

## BR-008

Chargebacks impactam Reputation.

---

## BR-009

Disputas impactam Reputation apenas após decisão final.

---

## BR-010

Reputation deve possuir versionamento.

---

# Permissões

Reputation.View

Reputation.Rebuild

Reputation.Admin

---

# Domain Policies

ReputationPolicy

TrustScorePolicy

FraudPolicy

CommunityPolicy

CompliancePolicy

---

# Domain Services

ReputationEngine

TrustScoreCalculator

FraudScoreCalculator

ReviewScoreCalculator

ProjectionBuilder

---

# Eventos Emitidos

ReputationUpdated

TrustScoreChanged

SellerRankingChanged

BuyerRankingChanged

---

# Eventos Consumidos

OrderCompleted

RefundSucceeded

ReviewCreated

DisputeResolved

ModerationDecision

ChargebackOpened

FraudDetected

---

# Compensações

Falha cálculo

↓

Retry.

---

Falha persistência

↓

Rollback.

---

Evento inválido

↓

Registrar.

↓

Descartar.

---

# Background Processing

Rebuild completo.

Ranking.

Analytics.

Dashboard.

Leaderboard.

Reindexação.

---

# Integrações

Redis

Supabase

Analytics

Search

Cloudflare

Event Bus

---

# SLA

SLA-001

Atualizar Reputation

≤ 30 segundos após evento.

---

SLA-002

Rebuild completo

Execução em background.

---

# Auditoria

Registrar

EntityId

Score anterior

Score novo

Evento origem

WorkflowId

CorrelationId

Timestamp

Versão

---

# Observabilidade

Latency

RetryCount

ProjectionLag

ProcessingTime

CorrelationId

---

# KPIs

KPI-001

Trust médio.

---

KPI-002

Top Sellers.

---

KPI-003

Top Buyers.

---

KPI-004

Tempo médio de atualização.

---

KPI-005

Fraudes detectadas.

---

KPI-006

Disputas por faixa de Reputation.

---

# Anti Patterns

É proibido

Editar Reputation manualmente.

Calcular Reputation dentro do Checkout.

Calcular Reputation durante Transaction.

Usar Reviews como única métrica.

Executar SQL direto.

Ignorar idempotência.

---

# Casos Extremos

Fraude em massa.

Rebuild completo.

Migração de algoritmo.

Rollback de eventos.

Chargeback meses depois.

Store restaurada.

---

# Implementação Esperada

```text
Domain Event

↓

Worker

↓

Projection Consumer

↓

Reputation Engine

↓

Load Aggregate

↓

Recalculate

↓

Repository

↓

Unit Of Work

↓

Persist

↓

Commit

↓

ReputationUpdated

↓

Ranking Projection

↓

Dashboard Projection

↓

Search Projection
```

---

# Dependências

order-lifecycle.md

refunds.md

disputes.md

moderation.md

business-rules.md

domain-event-contracts.md

---

# Evolução

Versões futuras poderão incluir:

- IA para previsão de fraude.
- Reputation por categoria de TCG.
- Reputation por idioma.
- Reputation por condição das cartas.
- Trust por eventos presenciais.
- Reputation baseada em ML.
- Reputation temporal (últimos 90 dias).
- Reputation regional.
- Reputation para lojistas profissionais.

---

# Relação com Reviews

Reviews representam apenas um dos sinais utilizados pelo Reputation Engine.

Uma avaliação positiva não compensa automaticamente fraudes, chargebacks ou recorrentes atrasos logísticos.

Da mesma forma, uma avaliação negativa isolada não invalida um histórico consistente de boas operações.

---

# Relação com Moderation

Decisões do Moderation Context podem congelar, reduzir ou impedir a evolução da Reputation conforme políticas de compliance.

O Reputation Context nunca toma decisões disciplinares; apenas reflete seus efeitos.

---

# Relação com Marketplace

A Reputation influencia diversos processos do JudgeTCG, incluindo:

- posicionamento em buscas;
- destaque de anúncios;
- elegibilidade para programas premium;
- prioridade em Buy Box;
- limites operacionais;
- exigência de garantias adicionais;
- acesso a funcionalidades avançadas.

Essas decisões são implementadas por políticas específicas em outros contextos, utilizando a Reputation como entrada, e nunca alterando-a diretamente.

---

# Regra Fundamental

A Reputation é uma projeção orientada a eventos que representa o nível de confiança acumulado de compradores e vendedores no JudgeTCG.

Ela é construída continuamente a partir do histórico operacional da plataforma, nunca pode ser editada manualmente e deve permanecer reproduzível, auditável, versionada e desacoplada dos processos transacionais.