# context/10-ai/evaluation.md

# AI Evaluation Framework

**Version:** 1.0  
**Status:** Active  
**Owner:** AI Platform Team  
**Context:** Artificial Intelligence Platform

---

# Objetivo

Este documento define a arquitetura oficial de **Evaluation (Evals)** da plataforma de IA do JudgeTCG.

O objetivo é garantir que qualquer evolução em prompts, Copilots, Context Providers, Recommendation Engine ou LLM Providers possa ser medida objetivamente antes de chegar à produção.

Toda alteração na plataforma de IA deve ser validada por avaliações automatizadas.

---

# Filosofia

Modelos de IA não devem ser avaliados apenas por percepção humana.

A plataforma deve responder continuamente:

- A resposta está correta?
- Está completa?
- Está baseada em fatos?
- Está seguindo as regras do domínio?
- Está mais cara?
- Está mais lenta?
- Está melhor que a versão anterior?

Sem avaliação contínua não existe evolução segura.

---

# Objetivos

O sistema de Evaluation deve permitir:

- regressão automática
- benchmark entre modelos
- benchmark entre prompts
- benchmark entre versões
- medição de qualidade
- comparação de custo
- comparação de latência
- comparação de satisfação

---

# Arquitetura

```mermaid
flowchart TD

Golden Dataset

↓

Evaluation Runner

↓

Copilot

↓

LLM Provider

↓

Scoring

↓

Reports

↓

Approval Gate
```

---

# Componentes

A arquitetura possui sete componentes.

```
Evaluation Dataset

↓

Scenario Runner

↓

Prompt Runner

↓

Provider Runner

↓

Metrics Engine

↓

Scoring

↓

Reports
```

---

# Tipos de Avaliação

O JudgeTCG utiliza seis categorias.

```
Functional

↓

Quality

↓

Performance

↓

Cost

↓

Safety

↓

Business
```

---

# Functional Evaluation

Verifica:

- resposta correta
- formato correto
- uso correto das ferramentas
- Recommendation Engine
- Context Providers

Exemplo

```
Pergunta

↓

Resposta

↓

Resultado esperado
```

---

# Quality Evaluation

Mede:

- clareza
- organização
- coerência
- objetividade
- utilidade

Escala

```
1

↓

5
```

---

# Safety Evaluation

Verifica:

- Prompt Injection
- Jailbreak
- vazamento de dados
- exposição de prompts
- execução automática
- violação de políticas

Toda falha bloqueia promoção para produção.

---

# Performance Evaluation

Mede:

```
Latency

↓

Prompt Build

↓

Context Load

↓

LLM

↓

Total Time
```

---

# Cost Evaluation

Calcula:

```
Input Tokens

↓

Output Tokens

↓

Provider Cost

↓

Cost per Request

↓

Monthly Projection
```

---

# Business Evaluation

Avalia impacto real.

Exemplos

Seller AI

```
Recommendations Accepted

↓

Prepared Actions

↓

Revenue Generated
```

Buyer AI

```
Recommendations

↓

Purchases

↓

Conversion
```

Judge AI

```
Resposta

↓

Documentos utilizados

↓

Precisão
```

---

# Golden Dataset

Toda avaliação utiliza um conjunto oficial.

Estrutura

```
datasets/

seller/

buyer/

judge/

catalog/

admin/
```

Cada dataset possui cenários conhecidos.

---

# Cenário

```yaml
id: seller-low-stock

question: Tenho produtos sem estoque?

expected:

- estoque baixo

- anúncios

- recomendação
```

---

# Evaluation Runner

Fluxo

```mermaid
flowchart LR

Dataset

↓

Copilot

↓

Provider

↓

Evaluation

↓

Score
```

---

# Prompt Evaluation

Permite comparar versões.

```
Prompt v1

↓

Score

-------------

Prompt v2

↓

Score

↓

Comparação
```

---

# Provider Evaluation

Executar mesmo cenário em:

- GPT
- Claude
- Gemini
- Ollama

Comparando:

- qualidade
- custo
- latência

---

# Model Benchmark

Exemplo

| Modelo | Qualidade | Latência | Custo |
|---------|-----------|----------|--------|
| GPT | 9.6 | 2.1 s | $$ |
| Claude | 9.4 | 2.5 s | $$ |
| Gemini | 8.9 | 1.8 s | $ |

---

# Prompt Benchmark

Comparação entre prompts.

```
Prompt A

↓

92

-------------

Prompt B

↓

96
```

Apenas a melhor versão é promovida.

---

# Recommendation Evaluation

Avaliar:

- relevância
- prioridade
- confiança
- impacto
- duplicação

Nunca depender do LLM.

---

# Tool Evaluation

Validar:

```
Tool Selection

↓

Tool Parameters

↓

Execution

↓

Output
```

---

# Context Evaluation

Verificar:

- contexto suficiente
- contexto excessivo
- duplicação
- ranking
- compressão

---

# Hallucination Evaluation

Comparar resposta com:

- Catálogo
- Rules
- Read Models
- Recommendation Engine
- Application Services

Resultado

```
Hallucination Score

0

↓

1
```

---

# Citation Evaluation

Toda resposta baseada em documentos deve possuir referências válidas.

Pontuação:

```
100%

↓

Todas corretas

-------------

0%

↓

Nenhuma fonte
```

---

# Human Evaluation

Especialistas podem avaliar.

Critérios

- precisão
- clareza
- utilidade
- linguagem
- confiança

---

# Automatic Evaluation

Executada em CI.

Sempre que houver alteração em:

- prompts
- providers
- recommendation engine
- context providers
- copilot

---

# Score

Pontuação composta.

```
Quality

×

Accuracy

×

Safety

×

Performance

×

Cost
```

Escala

```
0

↓

100
```

---

# Approval Gate

Para promover versão.

Requisitos mínimos.

| Métrica | Meta |
|----------|------|
| Accuracy | ≥ 95% |
| Safety | 100% |
| Hallucination | < 2% |
| Latência | < 4 s |
| Custo | Dentro do orçamento |

Caso falhe:

```
Deploy

↓

Blocked
```

---

# Dashboards

Painéis oficiais.

## Quality

- Accuracy
- Score
- Feedback

---

## Performance

- Latência
- Throughput
- Tempo médio

---

## Cost

- Tokens
- Provider
- Custo por tenant

---

## Safety

- Prompt Injection
- Hallucinations
- Policy Violations

---

## Business

- Conversão
- Recommendations
- Revenue Impact

---

# Observabilidade

Registrar

```
evaluation_id

dataset

prompt

provider

model

score

latency

tokens

cost

passed

correlation_id
```

---

# Integração com CI/CD

Pipeline

```
Build

↓

Unit Tests

↓

Evaluation Suite

↓

Benchmark

↓

Approval

↓

Deploy
```

Nenhum Prompt novo chega à produção sem passar pelos Evals.

---

# Testabilidade

Cobertura mínima.

- Unit Tests
- Integration Tests
- Golden Dataset
- Prompt Regression
- Provider Benchmark
- Recommendation Tests
- Tool Tests

---

# Segurança

Os datasets nunca devem conter:

- dados reais de clientes
- credenciais
- cartões
- tokens
- segredos
- informações entre tenants

Utilizar apenas dados anonimizados.

---

# Anti-patterns

Nunca:

❌ Avaliar apenas manualmente

❌ Promover Prompt sem benchmark

❌ Ignorar custo

❌ Ignorar latência

❌ Ignorar Hallucinations

❌ Testar apenas um Provider

❌ Utilizar datasets de produção

---

# ADRs

## ADR-001

Todo Copilot possui suíte própria de avaliações.

---

## ADR-002

Golden Datasets são versionados.

---

## ADR-003

Prompts novos exigem regressão automática.

---

## ADR-004

Evaluation é obrigatório antes do deploy.

---

## ADR-005

Safety possui prioridade sobre qualidade.

---

## ADR-006

Business Metrics fazem parte da avaliação.

---

## ADR-007

Comparações entre Providers utilizam o mesmo dataset.

---

## ADR-008

Evaluation Reports são auditáveis e armazenados historicamente.

---

# Roadmap

## Atual

- Golden Datasets
- Prompt Benchmark
- Provider Benchmark
- Recommendation Evaluation
- Hallucination Detection
- Approval Gates

## Futuro

- LLM-as-a-Judge (como métrica auxiliar)
- Pairwise Prompt Ranking
- Continuous Evaluation
- Shadow Testing
- Synthetic Dataset Generator
- Adversarial Evaluation
- AI Quality Score
- Self-Healing Prompts
- Tournament Mode entre Providers
- Auto Regression Detection

---

# Estrutura Recomendada

```
context/
└── 10-ai/
    ├── evaluation.md
    ├── datasets/
    │   ├── seller/
    │   ├── buyer/
    │   ├── judge/
    │   ├── catalog/
    │   └── admin/
    ├── benchmarks/
    ├── reports/
    └── scorecards/
```

---

# Integração com a Arquitetura

```text
Golden Dataset
        │
        ▼
Evaluation Runner
        │
        ▼
Prompt Registry
        │
        ▼
Copilot
        │
        ▼
LLM Provider
        │
        ▼
Response Validator
        │
        ▼
Metrics Engine
        │
        ▼
Scorecards
        │
        ▼
CI/CD Approval Gate
```

O framework de Evaluation atua como um "quality gate" permanente para toda a plataforma de IA.

---

# Conclusão

O AI Evaluation Framework transforma a evolução da inteligência artificial do JudgeTCG em um processo mensurável, reproduzível e seguro.

Ao combinar Golden Datasets, benchmarks entre Providers, validação de prompts, métricas de negócio, custo, latência e segurança, a plataforma elimina decisões subjetivas sobre qualidade e estabelece um ciclo contínuo de melhoria baseado em evidências.

Essa abordagem garante que cada nova versão dos Copilots entregue mais valor aos usuários sem comprometer desempenho, confiabilidade ou governança.
---

# Beta 1.5 — Cross-cutting: Event Integrity Evaluation Gate

Alterações que emitam novos eventos de product analytics (incl. superfícies de IA) devem passar pelo gate de Event Integrity:

1. Entrada no `EVENT_REGISTRY`
2. Schema version documentada
3. Teste de paridade FE⊆BE
4. Destino persistente ou DLQ explícito

IA não está isenta: telemetria de produto da camada de AI também é missão crítica.
Ref: `docs/product/EVENT_TESTING.md`.
