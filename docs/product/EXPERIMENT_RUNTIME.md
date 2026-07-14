 # EXPERIMENT_RUNTIME.md
**Versão:** 1.0  
**Status:** Public Beta  
**Base:** RC1 + Beta 2 Product Analytics Runtime

---

# Objetivo

O **Experiment Runtime** é a camada responsável por gerenciar experimentos controlados (A/B Tests, Feature Flags, Rollouts Graduais e Experimentação de Produto) do Judge TCG Marketplace.

Seu objetivo é permitir que qualquer evolução da plataforma seja validada por dados antes de atingir 100% da base de usuários.

O Experiment Runtime trabalha integrado ao Product Analytics Runtime, garantindo que toda decisão seja baseada em métricas reais.

---

# Missão

Responder continuamente:

- Uma nova interface melhora a conversão?
- Uma alteração reduziu abandono?
- Um novo algoritmo de busca gera mais pedidos?
- Vale a pena manter uma feature?
- Existe regressão após um deploy?
- Qual versão performa melhor?

---

# Arquitetura

```
Feature Flag

↓

Experiment Runtime

↓

Assignment Engine

↓

Exposure Event

↓

Product Analytics Runtime

↓

Funnels

↓

North Star

↓

Decision Engine
```

---

# Componentes

```
Experiment Registry

↓

Assignment Engine

↓

Traffic Router

↓

Exposure Tracker

↓

Metrics Collector

↓

Statistical Engine

↓

Decision Engine
```

---

# Fluxo

```
Usuário acessa

↓

Elegibilidade

↓

Randomização

↓

Variant A/B

↓

Exposure Event

↓

Uso da funcionalidade

↓

Conversão

↓

Analytics

↓

Resultado
```

---

# Estrutura de um Experimento

```
Experiment

id

name

description

owner

team

hypothesis

status

variants

traffic

start_at

end_at

north_star_metric

secondary_metrics

guardrails

decision

```

---

# Status

```
Draft

↓

Scheduled

↓

Running

↓

Paused

↓

Completed

↓

Archived
```

---

# Tipos

## A/B Test

Controle

Versão B

---

## Multivariate

A

B

C

D

---

## Canary

5%

25%

50%

100%

---

## Feature Flag

ON

OFF

---

## Progressive Rollout

Incremental

---

## Dark Launch

Código ativo

UI invisível

---

# Assignment

Usuário

↓

Hash

↓

Bucket

↓

Variant

---

Randomização determinística

```
buyer_id

seller_id

anonymous_id

session_id
```

---

# Persistência

Cada usuário mantém

```
experiment_id

variant

assigned_at
```

---

Nunca alterar variante durante o experimento.

---

# Exposure Event

Todo experimento gera

```
experiment_exposed
```

Payload

```
experiment_id

variant

user_id

session

timestamp

```

---

# Conversão

Relacionar

```
experiment_exposed

↓

purchase_completed

↓

North Star
```

---

# Hipótese

Todo experimento deve possuir

```
Problema

Hipótese

Mudança

Métrica

Critério de sucesso

```

---

Exemplo

```
Hipótese

Hero menor

↓

mais produtos acima da dobra

↓

CTR aumenta

↓

+5%
```

---

# Métricas Primárias

North Star

Conversão

Pedidos

GMV

Receita

---

# Métricas Secundárias

CTR

Wishlist

Tempo

Bounce

Sessões

Busca

---

# Guardrails

Nunca degradar

Disponibilidade

Checkout

Performance

Search

A11y

SEO

Erro

---

# Decision Engine

Resultado

```
Win

Lose

Neutral

Inconclusive
```

---

# Critérios

Significância

Tamanho mínimo

Tempo mínimo

Amostra mínima

---

# Segmentação

Buyer

Seller

Admin

Anonymous

Mobile

Desktop

País

Idioma

Jogo

---

# Exclusões

Equipe

QA

Bots

Crawler

Administrador

---

# Tráfego

```
5%

10%

25%

50%

100%
```

---

# Rollback

Qualquer guardrail violado

↓

Experiment OFF

↓

Flag OFF

↓

Rollback

---

# Alertas

Integrado ao

ALERT_ENGINE.md

Exemplos

Conversão caiu

Erro aumentou

Checkout piorou

LCP aumentou

---

# Dashboard

Mostrar

Experimentos ativos

Conversão

North Star

Winner

Tempo restante

---

# KPIs

Experimentos

Running

Completed

Win Rate

Rollback

Tempo médio

---

# Experiment Health Score (EHS)

```
Exposure

20%

+

Tracking

20%

+

Conversão

20%

+

Guardrails

20%

+

Confiabilidade Estatística

20%
```

Faixas

```
95+

Excelente
```

```
85+

Bom
```

```
70+

Atenção
```

```
<70

Crítico
```

---

# Regras

Todo experimento deve possuir

- owner
- hipótese
- documentação
- métricas
- guardrails
- plano de rollback
- data de encerramento

---

# Integração

Integra diretamente com

- PRODUCT_METRICS.md
- NORTH_STAR.md
- PRODUCT_HEALTH_RUNTIME.md
- FUNNEL_RUNTIME.md
- COHORT_RUNTIME.md
- ALERT_ENGINE.md
- EXECUTIVE_DASHBOARD.md

---

# Eventos

```
experiment_created

experiment_started

experiment_exposed

experiment_completed

experiment_paused

experiment_resumed

experiment_stopped

experiment_winner

experiment_rollback
```

---

# Governança

Nenhum experimento pode:

- alterar regras de negócio críticas;
- afetar pagamento sem rollback imediato;
- comprometer disponibilidade;
- degradar segurança;
- comprometer LGPD.

Todo experimento deve ser documentado antes da ativação.

---

# Roadmap

## Beta 2

- Registry
- Assignment Engine
- Exposure Tracking
- Dashboard
- KPIs
- Rollback Manual

---

## Beta 3

- Bayesian Experiments
- Sequential Testing
- Multi-Armed Bandit
- Auto Rollout
- Auto Rollback
- IA para geração de hipóteses
- Recomendação automática de variantes vencedoras

---

# Relação com a North Star

O Experiment Runtime existe para aumentar continuamente a **North Star Metric**.

Toda hipótese deve demonstrar impacto esperado em pelo menos um dos seguintes indicadores:

- Pedidos concluídos
- Conversão
- Receita
- Liquidez
- Retenção
- Search Quality
- Product Health Score

Caso um experimento aumente uma métrica secundária, mas reduza a North Star ou viole algum guardrail crítico, ele deve ser encerrado e revertido.

---

# Resumo

O **Experiment Runtime** é a plataforma oficial de experimentação do Judge TCG Marketplace. Ele permite validar hipóteses com rigor estatístico, controlar rollouts graduais, proteger métricas críticas e acelerar a evolução do produto baseada em evidências, sempre integrado ao Product Analytics Runtime e aos dashboards executivos.