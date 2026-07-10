# context/10-ai/README.md

# AI Architecture Handbook

**Version:** 1.0  
**Status:** Active  
**Owner:** Platform Architecture  
**Last Updated:** 2026-07

---

# Purpose

Este diretório documenta toda a arquitetura de Inteligência Artificial do JudgeTCG.

O objetivo é garantir que toda funcionalidade baseada em IA seja:

- previsível;
- auditável;
- desacoplada;
- determinística sempre que possível;
- barata para operar;
- fácil de evoluir;
- independente do fornecedor do modelo.

A IA nunca deve substituir regras de negócio.

Ela complementa a plataforma.

---

# Filosofia

No JudgeTCG, a IA não é tratada como um chatbot.

Ela é tratada como um conjunto de serviços especializados.

Cada serviço possui:

- responsabilidade única;
- contratos claros;
- observabilidade;
- controle de custos;
- isolamento entre tenants;
- versionamento.

---

# Objetivos

A arquitetura deve permitir:

- múltiplos copilotos
- múltiplos modelos
- múltiplos providers
- múltiplas estratégias de prompting
- múltiplas ferramentas (Tools)

sem alterar o restante da plataforma.

---

# Princípios Fundamentais

## 1. LLMs nunca contêm regras de negócio

Sempre:

```
Business Rules

↓

Application Services

↓

AI

↓

Narrativa
```

Nunca:

```
LLM

↓

decide regra

↓

executa ação
```

---

## 2. AI nunca altera estado sozinha

Toda alteração de estado exige:

```
Usuário

↓

Confirmação

↓

Command

↓

Aggregate

↓

Domain Events
```

Nunca:

```
LLM

↓

UPDATE DATABASE
```

---

## 3. IA produz recomendações

Ela pode:

- sugerir

- explicar

- resumir

- comparar

- organizar

- priorizar

Ela nunca deve:

- comprar

- vender

- cancelar pedidos

- aprovar pagamentos

- alterar estoque

- alterar reputação

- executar comandos automaticamente

---

## 4. Determinismo primeiro

Sempre que possível:

```
Regras

↓

Engine

↓

Resultado

↓

LLM apenas explica
```

Exemplo:

```
Pricing Engine

↓

Preço sugerido

↓

LLM explica

"Este preço é competitivo porque..."
```

---

## 5. Contexto controlado

A IA nunca recebe acesso direto ao banco.

Recebe apenas:

Application Services

Read Models

DTOs

View Models

Projections

---

# Arquitetura Geral

```
                        User

                          │

                          ▼

                  AI Application Service

                          │

             ┌────────────┴────────────┐

             ▼                         ▼

    Context Providers          Recommendation Engine

             ▼                         ▼

       Prompt Builder         Deterministic Rules

             ▼                         ▼

              └────────────┬───────────┘

                           ▼

                     LLM Provider

        (OpenAI / Claude / Local / Mock)

                           ▼

                   Structured Response

                           ▼

                  Action Preparation

                           ▼

                    Human Confirmation

                           ▼

                     Application Layer
```

---

# Camadas

## Context Layer

Responsável por reunir informações.

Exemplos:

Analytics

Orders

Pricing

Inventory

Catalog

Buyer

Seller

Judge

Finance

Reputation

Nunca consulta SQL diretamente.

---

## Prompt Layer

Transforma contexto em prompt.

É totalmente versionado.

Não contém regras.

---

## Recommendation Layer

Responsável pela lógica determinística.

É aqui que ficam:

priorização

ranking

pontuação

scoring

pesos

classificação

O LLM apenas converte o resultado em linguagem natural.

---

## Provider Layer

Abstrai os modelos.

Todos implementam a mesma interface.

Exemplo:

```
LlmProvider

↓

OpenAI

Claude

Azure

Google

Ollama

Mock
```

---

## Tool Layer

Representa ferramentas que o modelo pode utilizar.

Exemplo:

```
Search Cards

Search Orders

Seller Dashboard

Catalog Intelligence

Pricing

Judge

Analytics
```

Ferramentas nunca executam SQL.

Sempre chamam Application Services.

---

## Copilot Layer

Representa cada assistente da plataforma.

Cada copiloto possui responsabilidade própria.

Exemplos:

Seller Copilot

Buyer Copilot

Judge Copilot

Admin Copilot

Support Copilot

Catalog Copilot

---

# Copilots existentes

## Seller Copilot

Objetivo:

Auxiliar operações da loja.

Pode:

- resumir métricas

- identificar oportunidades

- sugerir preços

- detectar problemas

Nunca:

- alterar anúncios

- alterar estoque

- alterar pedidos

---

## Buyer Copilot

Objetivo:

Auxiliar decisões de compra.

Pode:

- comparar ofertas

- explicar diferenças

- sugerir cartas

- alertar queda de preço

Nunca:

- finalizar compra

- efetuar pagamento

---

## Judge Copilot

Objetivo:

Responder perguntas de regras.

Fontes:

RAG

Oracle

Comprehensive Rules

Tournament Rules

Policy Documents

Sempre cita fontes.

Nunca inventa regras.

---

## Admin Copilot

Objetivo:

Operação da plataforma.

Pode:

- detectar incidentes

- resumir métricas

- sugerir investigações

Nunca altera configurações automaticamente.

---

# Fluxo padrão

```
Usuário

↓

Pergunta

↓

AI Service

↓

Context Providers

↓

Prompt Builder

↓

Recommendation Engine

↓

LLM Provider

↓

Structured Output

↓

Human Review

↓

Resposta
```

---

# Estrutura desta pasta

```
10-ai/

README.md

ai-architecture.md

copilot.md

providers.md

tool-registry.md

context-providers.md

recommendation-engine.md

prompt-versioning.md

memory.md

observability.md

guardrails.md

evaluation.md

cost-control.md
```

---

# Relação com outros Handbooks

Este módulo depende diretamente de:

```
01-architecture/

02-domain/

03-marketplace/

04-catalog/

05-events/

06-security/

07-api/

08-frontend/

09-backend/
```

Nunca replica regras desses documentos.

Apenas consome contratos públicos.

---

# Princípios de Segurança

Toda IA deve obedecer:

- RBAC

- ABAC

- Tenant Isolation

- Feature Flags

- Rate Limits

- Prompt Validation

- Tool Validation

- Audit Trail

- Human Confirmation

---

# Observabilidade

Toda chamada de IA deve registrar:

- provider

- modelo

- prompt version

- contexto utilizado

- ferramentas utilizadas

- tempo

- custo

- tokens

- resposta

- erros

Sem armazenar informações sensíveis.

---

# Objetivos futuros

Esta arquitetura foi desenhada para suportar:

- Multi-Agent Systems

- Agent-to-Agent Communication

- Long-term Memory

- Planning Agents

- Workflow Agents

- AI Marketplace

- MCP (Model Context Protocol)

- OpenAI Responses API

- Anthropic Tool Use

- Local LLMs

- Fine-tuned Models

- Semantic Memory

- Vector Memory

- Autonomous Workflows (sempre com confirmação humana)

---

# Decisão Arquitetural

O JudgeTCG adota uma arquitetura **AI-First, mas não AI-Centric**.

A Inteligência Artificial é um acelerador da experiência do usuário, nunca a autoridade sobre o domínio do negócio.

Toda decisão de negócio continua pertencendo aos Aggregates, Domain Services e Application Services.

A IA interpreta, recomenda, resume e explica. Ela não governa o sistema.