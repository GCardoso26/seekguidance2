 # context/10-ai/prompt-versioning.md

# Prompt Versioning

**Version:** 1.0  
**Status:** Active  
**Owner:** AI Platform Team  
**Context:** Artificial Intelligence Platform

---

# Objetivo

Este documento define a estratégia oficial de **versionamento de prompts** do JudgeTCG.

Prompts são considerados **artefatos de software**.

Eles possuem:

- versionamento
- revisão
- testes
- rollout
- rollback
- telemetria
- auditoria

Prompts **não são strings espalhadas pelo código**.

---

# Filosofia

Prompts são equivalentes a código.

Portanto:

- possuem versionamento semântico;
- passam por revisão;
- são testáveis;
- possuem histórico;
- podem ser revertidos.

---

# Arquitetura

```mermaid
flowchart TD

Copilot

↓

Prompt Registry

↓

Prompt Version

↓

Prompt Builder

↓

LLM Provider
```

---

# Objetivos

O sistema de Prompt Versioning deve permitir:

- evolução segura;
- experimentação;
- A/B Tests;
- rollback imediato;
- auditoria completa;
- comparação entre versões;
- compatibilidade entre Copilots.

---

# Estrutura

Todo Prompt possui um identificador único.

Exemplo:

```
seller.daily_brief

buyer.shopping_assistant

judge.rules_answer

catalog.card_summary

admin.daily_report
```

Cada um possui diversas versões.

---

# Estrutura do Registry

```
Prompt Registry

↓

seller.daily_brief

├── v1

├── v2

├── v3

buyer.recommendation

├── v1

├── v2

judge.answer

├── v1

├── experimental
```

---

# Estrutura Física

```
context/

10-ai/

prompts/

seller/

daily_brief/

v1.md

v2.md

v3.md

buyer/

recommendation/

v1.md

judge/

answer/

v1.md
```

Nunca armazenar prompts em código-fonte.

---

# Prompt Metadata

Todo Prompt possui metadados.

```yaml
id: seller.daily_brief

version: 2

status: active

owner: ai-platform

created_at: 2026-07-08

language: pt-BR

provider: any

supports_streaming: true

supports_tools: true
```

---

# Prompt Builder

O Prompt Builder nunca utiliza prompts diretamente.

Fluxo:

```
Copilot

↓

Prompt Registry

↓

Prompt Version

↓

Prompt Builder

↓

Final Prompt
```

---

# Estrutura do Prompt

Todo prompt possui quatro blocos.

```
System

↓

Developer

↓

Context

↓

User
```

---

# Exemplo

```
System

↓

Você é o Seller Copilot...

--------------------

Developer

↓

Siga as políticas...

--------------------

Context

↓

Analytics

Inventory

Orders

--------------------

User

↓

Quais produtos devo anunciar?
```

---

# Versionamento Semântico

Toda alteração relevante incrementa versão.

```
v1

↓

v2

↓

v3

↓

v4
```

Alterações pequenas:

```
1.0.1

↓

1.0.2
```

Mudanças estruturais:

```
1.x

↓

2.0
```

---

# Compatibilidade

Um Copilot declara quais versões suporta.

```yaml
SellerCopilot

supports:

- daily_brief:v1

- daily_brief:v2
```

Isso permite migração gradual.

---

# Prompt Registry

O Registry resolve automaticamente a versão correta.

Exemplo:

```
Seller AI

↓

daily_brief

↓

v3
```

---

# Feature Flags

Prompts podem ser ativados por Feature Flags.

```
prompt_daily_v3

prompt_new_reasoning

prompt_experimental

prompt_ab_test
```

---

# Ambiente

Cada ambiente pode utilizar versões diferentes.

```
Development

↓

v4

----------------

Staging

↓

v3

----------------

Production

↓

v2
```

---

# Rollout

Estratégia oficial.

```
1%

↓

5%

↓

20%

↓

50%

↓

100%
```

Caso problemas ocorram:

Rollback imediato.

---

# Rollback

O Registry mantém histórico completo.

```
v4

↓

Erro

↓

v3
```

Sem necessidade de deploy.

---

# A/B Testing

É possível dividir usuários.

```
50%

↓

Prompt A

50%

↓

Prompt B
```

Métricas comparadas:

- satisfação
- latência
- custo
- aceitação
- ações executadas

---

# Prompt Templates

Os prompts utilizam templates.

Exemplo:

```
{{seller_name}}

{{trust_score}}

{{inventory_summary}}

{{recommendations}}
```

Nunca concatenar strings manualmente.

---

# Prompt Variables

Variáveis permitidas:

```
Tenant

User

Language

Intent

Context

Recommendations

Tools

Memory

Conversation
```

Nunca incluir segredos.

---

# Context Injection

O Prompt Builder injeta apenas Context Fragments.

```
Orders

↓

Inventory

↓

Analytics

↓

Pricing
```

Nunca entidades do domínio.

---

# Tool Injection

Ferramentas disponíveis são injetadas dinamicamente.

```
Tools

↓

Search Cards

↓

Pricing

↓

Analytics
```

Nunca listar ferramentas indisponíveis.

---

# Provider Independence

O mesmo Prompt pode ser utilizado por:

- GPT
- Claude
- Gemini
- Ollama

Sem alterações.

Quando necessário, adaptações ficam no Provider Adapter.

---

# Prompt Policies

Todo prompt deve:

- ser determinístico;
- evitar ambiguidades;
- citar limitações;
- respeitar guardrails;
- nunca instruir execução automática.

---

# Prompt Validation

Antes de ser publicado.

Checklist:

- sintaxe válida;
- placeholders existentes;
- sem variáveis órfãs;
- sem informações sensíveis;
- tamanho adequado.

---

# Observabilidade

Toda execução registra:

```
prompt_id

prompt_version

provider

model

latência

tokens_input

tokens_output

cache_hit

cost

tenant

user

copilot

intent

correlation_id
```

---

# Analytics

Métricas oficiais.

```
Acceptance Rate

↓

Prompt Success

↓

Fallback Rate

↓

Average Cost

↓

Average Tokens

↓

Hallucination Reports

↓

User Rating
```

---

# Auditoria

Toda alteração gera histórico.

```
Versão

Autor

Data

Descrição

Review

Deploy

Rollback
```

---

# Segurança

Prompts nunca devem conter:

- API Keys
- SQL
- Secrets
- Tokens JWT
- Dados entre tenants
- Informações sensíveis
- Credenciais

Todo conteúdo passa por sanitização.

---

# Testabilidade

Cada Prompt deve possuir:

- testes unitários;
- snapshots;
- golden tests;
- comparação entre versões;
- testes de regressão.

---

# Anti-patterns

Nunca:

❌ Prompt hardcoded

❌ Prompt concatenado

❌ Prompt no Controller

❌ Prompt dentro do Copilot

❌ Prompt específico do Provider

❌ Prompt sem versão

❌ Prompt sem auditoria

❌ Prompt alterado diretamente em produção

---

# ADRs

## ADR-001

Todo Prompt é um artefato versionado.

---

## ADR-002

Prompt Registry é a única fonte oficial.

---

## ADR-003

Prompts são independentes do Provider.

---

## ADR-004

Toda alteração é auditável.

---

## ADR-005

Rollback não depende de deploy.

---

## ADR-006

Prompt Builder é responsável por montar o prompt final.

---

## ADR-007

Feature Flags controlam experimentos.

---

## ADR-008

Templates substituem concatenação manual.

---

# Roadmap

## Atual

- Prompt Registry
- Prompt Builder
- Versionamento
- Rollback
- Feature Flags

## Futuro

- Prompt Linter
- Prompt Diff Viewer
- Prompt Playground
- Prompt Benchmark Suite
- Auto Evaluation
- Semantic Version Advisor
- Prompt Optimization Pipeline
- Self-Healing Prompts
- Multi-Language Prompt Packs
- Prompt Marketplace

---

# Integração com a Arquitetura

```
Copilot
      │
      ▼
Prompt Registry
      │
      ▼
Prompt Builder
      │
      ▼
Context Providers
      │
      ▼
Tool Registry
      │
      ▼
LLM Provider
      │
      ▼
Response Validator
```

O Prompt Builder é o único componente autorizado a montar prompts finais.

---

# Conclusão

O Prompt Versioning transforma prompts em componentes de primeira classe da arquitetura do JudgeTCG.

Ao tratá-los como software versionado, auditável e testável, a plataforma elimina dependências de strings espalhadas pelo código, facilita experimentação segura e prepara a infraestrutura para evolução contínua, múltiplos providers, A/B tests e futuras otimizações automáticas de prompts.