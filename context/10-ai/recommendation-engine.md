# context/10-ai/recommendation-engine.md

# Recommendation Engine

**Version:** 1.0  
**Status:** Active  
**Owner:** AI Platform Team  
**Context:** Artificial Intelligence Platform

---

# Objetivo

O Recommendation Engine é o componente responsável por transformar **dados estruturados** em **recomendações acionáveis**.

Ele é o cérebro determinístico dos Copilots.

O LLM apenas comunica as recomendações.

Ele **não decide** quais recomendações existem.

---

# Filosofia

A IA nunca deve inventar recomendações.

Ela apenas explica recomendações produzidas pelo domínio.

Sempre:

```
Domínio

↓

Recommendation Engine

↓

Recommendations

↓

LLM

↓

Linguagem Natural
```

Nunca:

```
Domínio

↓

LLM

↓

Decisão de negócio
```

---

# Princípios

O Recommendation Engine deve ser:

- determinístico
- explicável
- auditável
- testável
- reproduzível
- independente do provider

---

# Arquitetura

```mermaid
flowchart TD

Application Services

↓

Context Providers

↓

Recommendation Engine

↓

Recommendation Builder

↓

Prioritizer

↓

Recommendation DTO

↓

Copilot

↓

LLM
```

---

# Responsabilidades

O Recommendation Engine deve:

- analisar contexto
- detectar oportunidades
- identificar riscos
- calcular prioridades
- gerar recomendações
- preparar ações
- justificar decisões

Nunca:

- chamar OpenAI
- executar comandos
- alterar estado
- acessar banco diretamente

---

# Recommendation Pipeline

```mermaid
flowchart LR

Context

↓

Rule Evaluation

↓

Recommendation Builder

↓

Scoring

↓

Prioritization

↓

Prepared Actions

↓

Copilot
```

---

# Recommendation Object

Toda recomendação segue um contrato único.

```typescript
Recommendation {

id

type

title

summary

reason

priority

confidence

impact

category

actions

citations

metadata

}
```

---

# Recommendation Categories

## Inventory

```
Low Stock

Out of Stock

Duplicate Listing

Missing Images

Inactive Listings
```

---

## Pricing

```
Price Above Market

Price Below Market

Volatility

Opportunity

Suggested Discount

Suggested Increase
```

---

## Orders

```
Late Shipment

Pending Orders

SLA Risk

Order Stuck

Delayed Fulfillment
```

---

## Finance

```
Upcoming Settlement

Chargeback

Refund Spike

Escrow Hold

Payment Failure
```

---

## Reputation

```
Low Trust

Bad Reviews

Compliance Risk

Seller Level Up

Trust Opportunity
```

---

## Marketplace

```
Trending Card

High Demand

Market Opportunity

Competitor Price

Low Competition
```

---

## Buyer

```
Price Drop

Wishlist Available

Cheaper Store

Bundle Opportunity

Deck Completed
```

---

## Judge

```
Recent Oracle Change

New Ruling

Policy Update

Tournament Alert
```

---

# Recommendation Sources

Uma recomendação pode combinar múltiplos Context Providers.

Exemplo:

```
Inventory Context

+

Pricing Context

↓

Baixar preço
```

---

```
Orders Context

+

Reputation Context

↓

Responder pedidos rapidamente
```

---

# Rule Evaluation

Cada recomendação nasce de regras determinísticas.

Exemplo

```
IF

stock < minimum

↓

Generate

LOW_STOCK
```

---

```
IF

market_price <= listing_price -10%

↓

Generate

PRICE_OPPORTUNITY
```

---

```
IF

ticket_waiting > SLA

↓

Generate

CUSTOMER_AT_RISK
```

---

# Recommendation Builder

O Builder cria recomendações estruturadas.

```typescript
builder.build(

context

)

↓

Recommendation[]
```

---

# Confidence

Cada recomendação possui confiança.

Escala:

```
0.0

↓

1.0
```

Exemplo

```
0.98

Dados completos

-------------

0.52

Dados parciais
```

---

# Priority

Prioridade oficial.

```text
Critical

High

Medium

Low

Informational
```

---

# Impact

Cada recomendação estima impacto.

```typescript
Impact {

financial

operational

customer

trust

}
```

Exemplo

```
Alta receita

Baixo esforço
```

---

# Effort

Também calcula esforço.

```
Very Low

Low

Medium

High

Very High
```

---

# Opportunity Score

Pontuação composta.

```
Impact

×

Confidence

×

Urgency

×

Probability

↓

Opportunity Score
```

Escala:

```
0

↓

100
```

---

# Recommendation Ranking

Ordenação oficial.

```
Critical

↓

High Impact

↓

High Confidence

↓

Quick Wins

↓

Medium

↓

Low
```

---

# Recommendation Groups

Agrupamento automático.

Exemplo

```
3 produtos

↓

Mesmo problema

↓

Uma recomendação
```

Em vez de:

```
Produto A

Produto B

Produto C
```

---

# Deduplicação

Nunca gerar recomendações repetidas.

```
Mesmo problema

↓

Uma única recomendação

↓

Lista de itens afetados
```

---

# Prepared Actions

Toda recomendação pode produzir ações preparadas.

```typescript
PreparedAction {

command

title

description

requiresConfirmation

estimatedImpact

estimatedDuration

}
```

---

Exemplo

```
Recommendation

↓

Atualizar preço

↓

PreparePriceUpdate
```

---

# Nunca executar

O Recommendation Engine nunca chama:

```
UpdatePrice()

PublishListing()

ArchiveListing()

CreateOrder()
```

Ele apenas prepara.

---

# Recommendation Lifecycle

```mermaid
stateDiagram-v2

Detected

-->

Generated

-->

Prioritized

-->

Presented

-->

Accepted

-->

Prepared

-->

Executed

-->

Completed
```

Execução ocorre fora do Engine.

---

# Recommendation Expiration

Toda recomendação possui validade.

Exemplo

```
Price Opportunity

↓

10 minutos

------------

Low Stock

↓

1 hora

------------

Trending Card

↓

24 horas
```

---

# Recommendation Feedback

Usuários podem informar:

```
Útil

Não útil

Ignorar

Resolver depois
```

Esses dados alimentam analytics.

---

# Personalização

Cada tenant pode configurar:

- prioridades
- pesos
- thresholds
- categorias
- idioma
- feature flags

Sem alterar código.

---

# Marketplace Examples

## Seller

```
5 anúncios

sem imagem

↓

Adicionar imagens
```

---

```
Preço 18%

acima da média

↓

Reduzir preço
```

---

```
Pedido

há 48h

↓

Enviar hoje
```

---

## Buyer

```
Wishlist

↓

Preço caiu

↓

Comprar agora
```

---

```
Deck

faltam 3 cartas

↓

Comprar em uma única loja
```

---

## Judge

```
Nova Oracle

↓

Atualizar interpretação
```

---

# Recommendation Explanation

Toda recomendação possui justificativa.

Exemplo

```
Preço está

12%

acima da média

em

48 anúncios.
```

Nunca:

```
"A IA acha..."
```

---

# Analytics

Métricas:

```
Recommendations Generated

Accepted

Ignored

Rejected

Expired

Average Impact

Estimated Revenue

Execution Rate
```

---

# Observabilidade

Registrar:

```
recommendation_id

rule

priority

confidence

impact

execution_time

provider

copilot

tenant

user

correlation_id
```

---

# Segurança

Toda recomendação respeita:

- RBAC
- ABAC
- Tenant Isolation
- Store Isolation
- Feature Flags
- Plan Limits

---

# Testabilidade

Cada regra possui:

- teste unitário
- cenário positivo
- cenário negativo
- edge cases
- benchmark

Sem dependência de IA.

---

# Anti-patterns

Nunca:

❌ Perguntar ao LLM o que recomendar

❌ Hardcode em prompts

❌ SQL

❌ Repository

❌ Aggregate

❌ Auto Execute

❌ Atualizar estado

❌ Regras escondidas no frontend

❌ Regras escondidas em prompts

---

# ADRs

## ADR-001

Toda recomendação nasce de regras determinísticas.

---

## ADR-002

LLMs apenas comunicam recomendações.

---

## ADR-003

Prepared Actions substituem comandos automáticos.

---

## ADR-004

Recomendações são auditáveis.

---

## ADR-005

Priorização ocorre antes da chamada ao LLM.

---

## ADR-006

Recommendation Engine é independente de qualquer Provider.

---

## ADR-007

Todas as recomendações possuem justificativa explícita.

---

## ADR-008

Regras de recomendação pertencem ao domínio da plataforma, nunca ao prompt.

---

# Roadmap

## Atual

- Seller AI
- Buyer AI
- Pricing Recommendations
- Inventory Recommendations
- Reputation Recommendations

## Futuro

- Learning-to-Rank
- Feedback Loop
- Reinforcement Signals
- Recommendation Marketplace
- Cross-Tenant Benchmark
- Seasonal Intelligence
- Tournament Intelligence
- Personalized Ranking
- A/B Testing
- Multi-Agent Recommendation Pipeline

---

# Integração com a Arquitetura

O Recommendation Engine ocupa uma posição central na arquitetura de IA do JudgeTCG.

```
Context Providers
        │
        ▼
Recommendation Engine
        │
        ▼
Prepared Actions
        │
        ▼
Copilot
        │
        ▼
LLM Provider
        │
        ▼
Resposta ao usuário
```

Isso garante que **todo conhecimento de negócio permaneça dentro da plataforma**, enquanto os modelos de linguagem atuam apenas como uma camada de comunicação inteligente.

---

# Conclusão

O Recommendation Engine é a principal camada de inteligência determinística do JudgeTCG.

Ele transforma métricas, eventos e estados do domínio em recomendações estruturadas, explicáveis e auditáveis. Essa separação garante que decisões de negócio nunca dependam de um modelo de linguagem, preservando previsibilidade, segurança e evolução contínua da plataforma.

Essa arquitetura prepara o JudgeTCG para incorporar novos Copilots, modelos de IA e agentes especializados sem mover qualquer regra crítica para prompts ou provedores externos.