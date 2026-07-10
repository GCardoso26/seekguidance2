# context/10-ai/providers.md

# LLM Providers Architecture

**Version:** 1.0  
**Status:** Active  
**Owner:** AI Platform Team  
**Context:** Artificial Intelligence Platform

---

# Objetivo

Este documento define a arquitetura oficial da camada de **LLM Providers** do JudgeTCG.

A plataforma foi projetada para ser completamente independente de qualquer fornecedor de modelos de linguagem.

O restante da aplicação nunca conhece:

- OpenAI
- Claude
- Gemini
- Azure OpenAI
- Ollama
- DeepSeek
- Groq
- OpenRouter

Toda comunicação ocorre através de um contrato único.

---

# Filosofia

Os modelos de IA são infraestrutura.

Não fazem parte do domínio.

São intercambiáveis.

Toda mudança de provider deve ocorrer sem impacto no restante da plataforma.

---

# Arquitetura

```mermaid
flowchart LR

ApplicationService

↓

Prompt Builder

↓

LlmProvider Interface

↓

Provider Factory

↓

OpenAI

Claude

Gemini

Azure

Groq

OpenRouter

Ollama

Mock
```

---

# Objetivos

A camada de Providers deve permitir:

- troca transparente de modelo
- fallback automático
- balanceamento
- observabilidade
- controle de custos
- versionamento
- testes determinísticos
- feature flags
- múltiplos modelos simultâneos

---

# Interface Oficial

Todo provider implementa exatamente a mesma interface.

```typescript
interface LlmProvider {

id: string;

name: string;

supports(model: string): boolean;

complete(request): Promise<LlmResponse>;

stream(request): AsyncIterable<LlmChunk>;

embed(request): Promise<Embedding>;

healthCheck(): Promise<Health>;

estimateCost(request): CostEstimate;

}
```

Nenhum método adicional deve ser exposto ao restante da aplicação.

---

# Factory

Os providers são resolvidos através de uma Factory.

```
ProviderFactory

↓

OpenAI

↓

Claude

↓

Gemini

↓

Ollama

↓

Mock
```

Exemplo

```typescript
providerFactory.resolve("claude")

↓

ClaudeProvider
```

Nunca:

```typescript
new Claude(...)
```

---

# Provider Registry

Existe um registro central.

```text
ProviderRegistry

↓

OpenAI

Claude

Gemini

Azure

Groq

DeepSeek

OpenRouter

Ollama

Mock
```

O Registry conhece:

- disponibilidade
- prioridade
- health
- limites
- capacidades

---

# Capacidades

Cada provider informa suas capacidades.

```typescript
ProviderCapabilities {

chat

streaming

toolCalling

jsonMode

vision

reasoning

embeddings

audio

image

functionCalling

maxTokens

maxContext

}
```

Isso permite roteamento inteligente.

---

# Provider Selection

A escolha do provider ocorre por política.

Fluxo:

```mermaid
flowchart TD

Request

↓

Policy Engine

↓

Provider Selector

↓

Provider
```

---

# Selection Policies

A plataforma suporta diferentes políticas.

## Cheapest

Sempre utilizar o provider de menor custo.

---

## Fastest

Sempre utilizar o menor tempo de resposta.

---

## HighestQuality

Sempre utilizar o modelo com maior qualidade.

---

## FeatureBased

Seleciona pelo recurso necessário.

Exemplo

```
Tool Calling

↓

Claude

----------------

Embeddings

↓

OpenAI

----------------

Vision

↓

Gemini
```

---

## Explicit

Definido pelo Application Service.

Exemplo

```
Judge

↓

Claude

-----------------

Seller AI

↓

GPT

-----------------

Catalog

↓

Gemini
```

---

# Multi-Provider Strategy

A plataforma pode utilizar diferentes providers simultaneamente.

Exemplo

```
Seller

↓

GPT-5

Buyer

↓

Claude

Judge

↓

Claude

Catalog

↓

Gemini

Embeddings

↓

text-embedding-3-large
```

Nenhum conflito.

---

# Fallback

Caso um provider falhe.

```mermaid
flowchart TD

OpenAI

↓

Erro

↓

Claude

↓

Erro

↓

Gemini

↓

Erro

↓

Mock

↓

Erro

↓

Unavailable
```

Toda troca é transparente.

---

# Retry Policy

Retry apenas para erros transitórios.

Exemplo

```
429

↓

Retry

------------

503

↓

Retry

------------

400

↓

Não

------------

401

↓

Não

------------

403

↓

Não
```

---

# Circuit Breaker

Cada provider possui Circuit Breaker.

Estados:

```
Closed

↓

Open

↓

Half Open

↓

Closed
```

Protege contra cascata de falhas.

---

# Timeout

Cada provider possui timeout independente.

Exemplo

```
OpenAI

30 s

Claude

45 s

Gemini

30 s

Ollama

120 s
```

Nunca esperar indefinidamente.

---

# Streaming

Todo provider deve implementar streaming quando suportado.

Contrato:

```typescript
AsyncIterable<LlmChunk>
```

Chunks:

```
Thinking

↓

Text

↓

Tool Calls

↓

Finish
```

---

# Tool Calling

Provider apenas encaminha ferramentas.

Nunca executa ferramentas.

Fluxo:

```
LLM

↓

Tool Request

↓

Tool Registry

↓

Application Service

↓

Tool Result

↓

LLM
```

---

# Structured Output

Todos os providers retornam:

```typescript
LlmResponse {

content

structuredOutput

toolCalls

usage

finishReason

providerMetadata

}
```

Nunca retornar objetos específicos do SDK.

---

# Embeddings

A interface suporta embeddings.

```typescript
Embedding {

vector

dimensions

provider

model

}
```

Mesmo contrato para qualquer modelo.

---

# Model Registry

Além do Provider Registry existe um catálogo de modelos.

```text
Model Registry

↓

GPT-5

GPT-5 Mini

Claude Sonnet

Claude Opus

Gemini Pro

DeepSeek Chat

Llama

Mistral

Qwen
```

Cada modelo informa:

- contexto máximo
- custo
- velocidade
- precisão
- suporte a tools
- suporte a JSON

---

# Configuração

Nunca hardcode.

Exemplo

```yaml
AI_PROVIDER=openai

AI_MODEL=gpt-5

AI_FALLBACK=claude

AI_EMBEDDINGS=text-embedding-3-large

AI_REASONING_MODEL=claude-opus
```

---

# Multi-Tenant

Cada tenant pode utilizar configuração própria.

Exemplo

```
Tenant A

↓

Claude

-----------------

Tenant B

↓

OpenAI

-----------------

Tenant C

↓

Local Ollama
```

---

# Feature Flags

Exemplo

```
enable_reasoning_models

enable_vision

enable_streaming

enable_tool_calling

enable_mock_provider
```

Permite rollout gradual.

---

# Observabilidade

Cada chamada registra:

```
provider

model

latency

queue_time

tokens_input

tokens_output

cache_hit

retry_count

fallback_used

estimated_cost

currency

finish_reason

error

request_id

correlation_id
```

---

# Controle de Custos

Antes da execução.

Provider calcula:

```typescript
CostEstimate {

estimatedInputTokens

estimatedOutputTokens

estimatedCost

currency

}
```

Application Service pode cancelar a execução.

---

# Cache

A camada suporta:

## Prompt Cache

Mesmo prompt.

Mesmo resultado.

---

## Semantic Cache

Perguntas semanticamente equivalentes.

---

## Embedding Cache

Embeddings nunca recalculados desnecessariamente.

---

# Segurança

Providers nunca recebem:

- credenciais internas
- SQL
- secrets
- tokens de usuários
- informações sensíveis
- dados entre tenants

Todo contexto passa por sanitização.

---

# Testabilidade

Existe um Mock Provider.

Objetivos:

- testes unitários
- integração
- CI
- desenvolvimento offline

Nunca consumir APIs externas durante testes.

---

# Anti-patterns

Nunca:

❌ SDK do provider espalhado pelo código

❌ Prompt chamando OpenAI diretamente

❌ Aggregate utilizando Provider

❌ Provider contendo regras de negócio

❌ Provider chamando banco

❌ Dependência de modelo específico

❌ Uso de classes do SDK fora da camada Provider

❌ Hardcode de API Keys

❌ Tratamento de erro duplicado

---

# ADRs

## ADR-001

Todo provider implementa `LlmProvider`.

---

## ADR-002

Toda seleção de modelo passa pelo Provider Registry.

---

## ADR-003

Application Services nunca conhecem SDKs.

---

## ADR-004

Fallback é transparente.

---

## ADR-005

Providers são stateless.

---

## ADR-006

Tool Calling é responsabilidade do Tool Registry.

---

## ADR-007

Custo estimado é calculado antes da execução.

---

## ADR-008

Toda chamada gera telemetria.

---

## ADR-009

O Mock Provider é obrigatório para testes automatizados.

---

# Roadmap

## Fase Atual

- OpenAI
- Claude
- Mock

## Próximas integrações

- Gemini
- Azure OpenAI
- Ollama
- Groq
- OpenRouter
- DeepSeek
- Mistral
- Qwen
- AWS Bedrock
- Vertex AI

---

# Conclusão

A camada de Providers isola completamente a plataforma das implementações específicas de modelos de linguagem.

Ela garante intercambialidade, observabilidade, controle de custos e evolução contínua, permitindo que o JudgeTCG adote novos modelos sem alterar Application Services, Copilots ou Context Providers.

Essa separação transforma os LLMs em componentes de infraestrutura, mantendo a inteligência de negócio sob controle da própria plataforma.