# context/10-ai/context-providers.md

# Context Providers

**Version:** 1.0  
**Status:** Active  
**Owner:** AI Platform Team  
**Context:** Artificial Intelligence Platform

---

# Objetivo

Este documento define a arquitetura oficial dos **Context Providers** do JudgeTCG.

Context Providers são responsáveis por reunir todas as informações necessárias para que um Copilot execute uma tarefa.

Eles representam a camada de coleta de contexto entre a IA e os Application Services.

Eles **não fazem inferências**, **não geram respostas** e **não executam regras de negócio**.

Sua única responsabilidade é fornecer contexto estruturado.

---

# Filosofia

Um Copilot nunca consulta diretamente:

- Repositories
- Aggregates
- SQL
- APIs externas
- Redis
- Supabase

Sempre solicita informações através de Context Providers.

```
Copilot

↓

Context Providers

↓

Application Services

↓

Read Models

↓

DTOs
```

Essa arquitetura garante:

- baixo acoplamento
- reutilização
- testabilidade
- isolamento do domínio
- observabilidade

---

# Arquitetura

```mermaid
flowchart TD

Copilot

↓

Orchestrator

↓

Catalog Context

Seller Context

Buyer Context

Orders Context

Analytics Context

Pricing Context

Finance Context

Reputation Context

↓

Application Services

↓

Read Models

↓

DTOs
```

---

# Responsabilidades

Cada Context Provider deve:

- consultar Application Services
- montar DTOs
- normalizar dados
- remover informações sensíveis
- aplicar permissões
- retornar contexto estruturado

Nunca deve:

- executar comandos
- alterar estado
- gerar prompts
- chamar Providers de IA
- aplicar regras de negócio complexas

---

# Interface Oficial

Todos os Context Providers implementam a mesma interface.

```typescript
interface ContextProvider {

id: string;

supports(intent): boolean;

collect(context): Promise<ContextFragment>;

}
```

---

# Context Fragment

Cada Provider retorna apenas sua parte do contexto.

```typescript
ContextFragment {

provider

version

timestamp

payload

metadata

}
```

O Copilot nunca depende do formato interno de outro Provider.

---

# Context Orchestrator

O Orchestrator coordena a coleta de contexto.

Fluxo:

```mermaid
sequenceDiagram

Copilot->>Orchestrator: gatherContext()

Orchestrator->>OrdersContext

Orchestrator->>InventoryContext

Orchestrator->>PricingContext

Orchestrator->>AnalyticsContext

Orchestrator->>ReputationContext

OrdersContext-->>Orchestrator

InventoryContext-->>Orchestrator

PricingContext-->>Orchestrator

AnalyticsContext-->>Orchestrator

ReputationContext-->>Orchestrator

Orchestrator-->>Copilot
```

Todos os Providers podem ser executados em paralelo.

---

# Context Composition

O contexto final é composto pela união dos fragmentos.

```text
Seller Context

+

Orders Context

+

Inventory Context

+

Pricing Context

+

Analytics Context

↓

Seller AI Context
```

Nenhum Provider conhece os demais.

---

# Seller Context

Responsável por informações gerais da loja.

Exemplo:

```
Store

Plan

Seller Level

Subscription

Capabilities

Feature Flags

Limits

Locale
```

Fonte:

```
Seller Application Service
```

---

# Orders Context

Responsável pelo estado operacional dos pedidos.

Exemplo:

```
Pedidos pendentes

Pedidos enviados

Pedidos atrasados

SLA

Chargebacks

Tempo médio

Receita
```

Origem:

```
Seller Dashboard Service
```

---

# Inventory Context

Responsável pelo inventário.

Retorna:

```
Quantidade

Baixo estoque

Sem estoque

Anúncios pausados

Produtos ocultos

Imagens ausentes

Produtos duplicados
```

Origem:

```
Inventory Application Service
```

---

# Pricing Context

Responsável por inteligência de preços.

Retorna:

```
Preço médio

Preço mínimo

Preço sugerido

Diferença mercado

Competitividade

Volatilidade

Histórico
```

Origem:

```
Pricing Engine
```

---

# Analytics Context

Responsável pelos indicadores da loja.

Exemplo:

```
Receita

Conversão

CTR

Visualizações

Produtos vendidos

Categorias

Performance

Crescimento
```

Origem:

```
Marketplace Intelligence
```

---

# Finance Context

Retorna:

```
Saldo

Repasses

Chargebacks

Pagamentos

Pendências

Escrow

Recebimentos futuros
```

Origem:

```
Settlement Service
```

---

# Reputation Context

Retorna:

```
Trust Score

Seller Level

Badges

Avaliações

SLA

Disputas

Compliance

Histórico
```

Origem:

```
Reputation Engine
```

---

# Tickets Context

Retorna:

```
Tickets

Prioridade

Tempo de resposta

Categorias

Clientes aguardando

SLA
```

Origem:

```
Support Application Service
```

---

# Catalog Context

Responsável pelas informações das cartas.

Retorna:

```
Card

Variants

Prices

Oracle

Rulings

Sets

Reprints

Popularity

Demand

Staples
```

Origem:

```
Catalog Application Service
```

---

# Buyer Context

Responsável pelo comprador.

Exemplo:

```
Wishlist

Collection

Carrinho

Pedidos

Decks

Favoritos

Histórico
```

Origem:

```
Buyer Dashboard
```

---

# Judge Context

Retorna:

```
Oracle

Comprehensive Rules

Tournament Rules

Erratas

Policy

Rulings

Referências
```

Origem:

```
Judge Application Service
```

---

# Admin Context

Retorna:

```
KPIs

Incidentes

Usuários

Moderação

Filas

Jobs

Alertas

Performance
```

---

# Intent Resolution

Cada Provider informa quais intenções suporta.

Exemplo

```
seller.daily_brief

↓

Orders

Analytics

Pricing

Inventory

Finance
```

---

```
buyer.compare

↓

Catalog

Pricing

Marketplace

Reputation
```

---

# Lazy Context

Nem todo contexto deve ser carregado.

Exemplo

```
Buyer

↓

não precisa

Finance Context
```

Isso reduz custo e latência.

---

# Context Priority

Cada Provider informa prioridade.

```typescript
Priority

Critical

High

Medium

Low
```

O Orchestrator pode cancelar Providers de baixa prioridade em caso de timeout.

---

# Context TTL

Cada fragmento possui tempo de vida.

Exemplo

```
Orders

30 s

Inventory

60 s

Pricing

120 s

Catalog

1 h

Judge

24 h
```

Permite cache inteligente.

---

# Context Cache

Tipos suportados:

- Memory Cache
- Redis Cache
- Projection Cache
- Semantic Cache (futuro)

Cada Provider decide sua política de cache.

---

# Sanitização

Antes de retornar dados:

- remover PII
- remover secrets
- ocultar credenciais
- ocultar dados entre tenants
- limitar tamanho do payload

---

# Token Budget

Cada Provider informa o tamanho aproximado do contexto.

```typescript
ContextBudget {

estimatedTokens

priority

compressible

}
```

O Orchestrator pode resumir ou descartar partes menos importantes para respeitar o limite de contexto do modelo.

---

# Compression

Caso o contexto exceda o orçamento.

Estratégia:

```
DTO

↓

Resumo determinístico

↓

Resumo IA (opcional)

↓

Prompt
```

Nunca enviar milhares de registros ao LLM.

---

# Observabilidade

Cada execução registra:

```
provider

latência

cache_hit

payload_size

tokens

timeout

erro

tenant

user

intent

request_id

correlation_id
```

---

# Segurança

Todo Provider deve:

- validar permissões
- validar tenant
- validar store
- aplicar ABAC
- respeitar feature flags
- registrar auditoria

---

# Testabilidade

Cada Context Provider deve possuir:

- testes unitários
- mocks
- contrato estável
- validação de DTO
- benchmark de performance

Não depende de nenhum Provider de IA.

---

# Anti-patterns

Nunca:

❌ Consultar Repository diretamente

❌ Escrever no banco

❌ Executar Commands

❌ Gerar Prompt

❌ Chamar OpenAI

❌ Aplicar regras de negócio

❌ Compartilhar estado

❌ Depender de outro Context Provider

❌ Retornar entidades do domínio

---

# ADRs

## ADR-001

Todo Context Provider consulta apenas Application Services.

---

## ADR-002

Context Providers são independentes entre si.

---

## ADR-003

O Copilot recebe apenas Context Fragments.

---

## ADR-004

Coleta paralela é obrigatória sempre que possível.

---

## ADR-005

Todo contexto é sanitizado antes de chegar ao LLM.

---

## ADR-006

Cada Provider define seu TTL e política de cache.

---

## ADR-007

Context Providers nunca executam lógica de IA.

---

## ADR-008

O Context Orchestrator é responsável por compor o contexto final.

---

# Roadmap

## Atual

- Seller Context
- Buyer Context
- Catalog Context
- Orders Context
- Inventory Context
- Pricing Context
- Analytics Context
- Finance Context
- Reputation Context
- Judge Context
- Tickets Context

## Futuro

- Collection Context
- Deck Context
- Tournament Context
- CRM Context
- Marketing Context
- Fraud Context
- Compliance Context
- Notification Context
- Workflow Context
- Memory Context
- Multi-Agent Shared Context

---

# Conclusão

Os Context Providers representam a ponte entre o domínio do JudgeTCG e sua camada de Inteligência Artificial.

Ao centralizar a coleta de contexto em componentes especializados, a plataforma preserva a separação entre domínio, aplicação e IA, reduz acoplamento, melhora a reutilização e permite que novos Copilots sejam adicionados sem alterar a arquitetura existente.

Essa abordagem também prepara o JudgeTCG para futuras evoluções, como memória semântica, agentes cooperativos, Model Context Protocol (MCP) e orquestração multi-agente.