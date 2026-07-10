# context/10-ai/cost-control.md

# AI Cost Control

**Version:** 1.0  
**Status:** Active  
**Owner:** AI Platform Team  
**Context:** Artificial Intelligence Platform

---

# Objetivo

Este documento define a arquitetura oficial de **Cost Control** da plataforma de IA do JudgeTCG.

O objetivo é garantir que a utilização de modelos de linguagem permaneça financeiramente sustentável, previsível e escalável, sem comprometer a qualidade da experiência do usuário.

O controle de custos é tratado como um requisito arquitetural, não apenas operacional.

---

# Filosofia

A IA deve ser utilizada quando agrega valor.

Nem toda solicitação deve resultar em uma chamada para um LLM.

A ordem de prioridade da plataforma é:

```
Regra determinística

↓

Read Model

↓

Search

↓

Recommendation Engine

↓

LLM
```

Quanto menos dependência do LLM, menor custo, maior previsibilidade e maior velocidade.

---

# Objetivos

O sistema de Cost Control deve permitir:

- orçamento por tenant
- orçamento por loja
- orçamento por usuário
- orçamento por Copilot
- monitoramento em tempo real
- projeção de custos
- otimização automática
- fallback inteligente
- limitação por plano

---

# Arquitetura

```mermaid
flowchart TD

Request

↓

AI Gateway

↓

Cost Control Engine

↓

Budget Validator

↓

Provider Router

↓

LLM Provider

↓

Telemetry

↓

Cost Dashboard
```

---

# Componentes

A arquitetura possui oito componentes.

```
Budget Manager

↓

Quota Manager

↓

Token Estimator

↓

Provider Router

↓

Cost Calculator

↓

Forecast Engine

↓

Analytics

↓

Alerts
```

---

# Fluxo

```mermaid
flowchart LR

Request

↓

Estimate Tokens

↓

Estimate Cost

↓

Validate Budget

↓

Provider Selection

↓

Execute

↓

Record Cost
```

Toda chamada passa pelo Cost Control Engine.

---

# Fontes de Custo

Custos são calculados considerando:

- tokens de entrada
- tokens de saída
- embeddings
- reranking
- ferramentas externas
- chamadas HTTP pagas
- processamento adicional

---

# Hierarquia de Orçamento

O orçamento é validado em múltiplos níveis.

```
Global

↓

Tenant

↓

Store

↓

User

↓

Copilot

↓

Request
```

O menor limite sempre prevalece.

---

# Budget Manager

Responsável por:

- criar orçamentos
- atualizar limites
- bloquear excedentes
- gerar alertas
- calcular consumo

---

# Quotas

Cada plano possui cotas configuráveis.

Exemplo:

| Plano | Requests/mês | Tokens/mês |
|---------|--------------:|-----------:|
| Free | 500 | 500.000 |
| Player PRO | 5.000 | 5.000.000 |
| Loja LGS | 25.000 | 30.000.000 |
| Enterprise | Configurável | Configurável |

Todas as cotas são parametrizadas.

---

# Limites por Copilot

Cada Copilot possui orçamento próprio.

Exemplo

```
Seller AI

40%

Buyer AI

25%

Judge AI

20%

Catalog AI

10%

Admin AI

5%
```

Evita concentração de custos.

---

# Token Estimation

Antes de qualquer chamada.

```
Prompt

↓

Context

↓

Memory

↓

Expected Output

↓

Estimated Tokens
```

Caso exceda o limite:

- resumir contexto;
- reduzir resposta;
- utilizar outro modelo;
- cancelar execução.

---

# Context Optimization

A plataforma nunca envia contexto desnecessário.

Estratégias:

- ranking
- compressão
- deduplicação
- sumarização
- TTL
- cache

---

# Cache Strategy

Sempre verificar cache antes do Provider.

```
Request

↓

Cache

↓

Hit?

↓

Sim

↓

Resposta

↓

Não

↓

Provider
```

Tipos de cache:

- Prompt Cache
- Embedding Cache
- Response Cache
- Context Cache
- Recommendation Cache

---

# Provider Routing

O roteador escolhe o modelo mais econômico compatível.

Exemplo

```
Resumo

↓

Modelo Econômico

------------

Explicação Técnica

↓

Modelo Avançado

------------

Análise Complexa

↓

Modelo Premium
```

Nunca utilizar um modelo caro sem necessidade.

---

# Fallback

Caso o orçamento seja insuficiente.

Fluxo:

```
Modelo Premium

↓

Modelo Standard

↓

Modelo Econômico

↓

Resposta Determinística

↓

Erro Controlado
```

O usuário nunca recebe erro inesperado.

---

# Cost Calculator

Toda execução registra:

```
input_tokens

output_tokens

cached_tokens

provider

model

estimated_cost

actual_cost

currency

timestamp
```

---

# Forecast Engine

Projeções:

- diário
- semanal
- mensal
- anual

Também calcula:

- tendência
- crescimento
- consumo médio
- previsão de estouro

---

# Dashboards

## Global

- custo total
- custo por provider
- custo por modelo
- economia por cache

---

## Tenant

- consumo
- orçamento restante
- requests
- tokens

---

## Seller AI

- custo por briefing
- custo por insight
- custo por ação preparada

---

## Buyer AI

- custo por recomendação
- custo por carrinho inteligente
- custo por sugestão

---

## Judge AI

- custo por consulta
- custo por documento
- custo por resposta

---

# Alertas

Alertas automáticos.

```
50%

↓

75%

↓

90%

↓

100%
```

Ao atingir:

- notificar administrador;
- registrar evento;
- sugerir upgrade;
- ativar modo econômico (opcional).

---

# Cost Optimization

Estratégias oficiais.

## Context Reduction

Remover contexto irrelevante.

---

## Prompt Compression

Prompts menores.

---

## Memory Compression

Utilizar resumos.

---

## Model Routing

Escolher modelo adequado.

---

## Tool First

Executar ferramentas antes do LLM.

---

## Read Models

Preferir projeções.

---

## Recommendation Engine

Responder por regras quando possível.

---

## Cache

Evitar chamadas repetidas.

---

## Streaming

Encerrar respostas quando apropriado.

---

# Rate Limits

Aplicados por:

```
Tenant

↓

Store

↓

User

↓

Copilot

↓

IP
```

Configuráveis.

---

# Plano Comercial

Integração com assinaturas.

Exemplo

```
Free

↓

Sem Seller AI

------------

Player PRO

↓

Buyer AI

Judge AI

------------

LGS

↓

Seller AI

Buyer AI

Judge AI

------------

Enterprise

↓

Todos
```

O Cost Control consulta o plano antes da execução.

---

# Multi-Tenant

Custos nunca são compartilhados.

Cada tenant possui:

- orçamento
- métricas
- alertas
- dashboards

Independentes.

---

# Observabilidade

Registrar:

```
tenant_id

store_id

user_id

copilot

provider

model

estimated_tokens

actual_tokens

estimated_cost

actual_cost

cache_hit

latency

correlation_id
```

---

# KPIs

Métricas oficiais.

| KPI | Objetivo |
|------|----------|
| Custo por Request | ↓ |
| Custo por Usuário | ↓ |
| Custo por Copilot | ↓ |
| Cache Hit Rate | ↑ |
| Requests sem LLM | ↑ |
| Economia por Cache | ↑ |
| Tokens Médios | ↓ |
| Latência | ↓ |

---

# SLO

| Métrica | Meta |
|----------|------|
| Estimativa de custo | < 5 ms |
| Validação de orçamento | < 2 ms |
| Seleção de Provider | < 10 ms |
| Registro de custo | Assíncrono |

---

# Segurança

Nunca registrar:

- prompts completos;
- dados sensíveis;
- cartões;
- API Keys;
- segredos.

Os registros financeiros devem respeitar LGPD e políticas internas.

---

# Testabilidade

O Cost Control deve possuir:

- testes unitários;
- testes de carga;
- testes de orçamento;
- testes de fallback;
- testes de roteamento;
- testes de cache;
- simulações de consumo.

---

# Anti-patterns

Nunca:

❌ Chamar LLM sem estimativa

❌ Ignorar orçamento

❌ Usar sempre o modelo mais caro

❌ Não utilizar cache

❌ Não registrar custos

❌ Misturar custos entre tenants

❌ Fazer chamadas duplicadas

❌ Calcular custo apenas no frontend

---

# ADRs

## ADR-001

Toda chamada passa pelo Cost Control Engine.

---

## ADR-002

Estimativa de custo ocorre antes da execução.

---

## ADR-003

Provider Router prioriza custo-benefício.

---

## ADR-004

Cache é obrigatório antes do Provider.

---

## ADR-005

Recommendation Engine reduz dependência de LLMs.

---

## ADR-006

Cada plano possui orçamento próprio.

---

## ADR-007

Custos são métricas de primeira classe.

---

## ADR-008

Fallback econômico é preferível a falha de serviço.

---

# Roadmap

## Atual

- Budget Manager
- Provider Routing
- Cache
- Forecast
- Dashboards
- Quotas
- Alertas

## Futuro

- Dynamic Budget Allocation
- AI Cost Optimizer
- Carbon Footprint Estimation
- Intelligent Prompt Compression
- Adaptive Model Routing
- FinOps Dashboard
- Predictive Budget Alerts
- Auto Cost Anomaly Detection
- Multi-Cloud Cost Balancer
- ROI por Copilot

---

# Estrutura Recomendada

```
context/
└── 10-ai/
    ├── cost-control.md
    ├── budgets/
    ├── quotas/
    ├── providers/
    ├── forecasts/
    ├── dashboards/
    ├── reports/
    └── policies/
```

---

# Integração com a Arquitetura

```text
Request
    │
    ▼
AI Gateway
    │
    ▼
Cost Control Engine
    ├──────── Budget Manager
    ├──────── Quota Manager
    ├──────── Token Estimator
    ├──────── Provider Router
    └──────── Cache Manager
             │
             ▼
        LLM Provider
             │
             ▼
      Telemetry Pipeline
             │
             ▼
      Cost Dashboards
```

O Cost Control envolve toda a execução da IA e garante que nenhuma chamada aos modelos ocorra sem validação prévia de orçamento, cotas e estratégia de otimização.

---

# Conclusão

O AI Cost Control estabelece uma camada de governança financeira para toda a plataforma de IA do JudgeTCG.

Ao integrar estimativa de tokens, roteamento inteligente de modelos, cache, limites por plano, monitoramento contínuo e projeções de consumo, a plataforma mantém custos previsíveis e sustentáveis sem comprometer a qualidade da experiência dos usuários.

Essa arquitetura aproxima práticas de **FinOps**, **AIOps** e **Platform Engineering**, permitindo que a evolução da inteligência artificial ocorra de forma escalável, auditável e economicamente viável.