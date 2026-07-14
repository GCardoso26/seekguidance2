 # Executive Dashboard
**Versão:** 1.0  
**Status:** Public Beta  
**Base:** RC1 + Beta 2 Product Analytics Runtime

---

# Objetivo

O **Executive Dashboard** é o painel oficial de acompanhamento executivo do Judge TCG Marketplace.

Seu objetivo é fornecer, em uma única visão, o estado atual do negócio, da plataforma e da experiência do usuário, permitindo decisões rápidas baseadas em dados.

Este dashboard **não é operacional**.

Ele responde apenas às perguntas estratégicas:

- O produto está saudável?
- Estamos crescendo?
- Estamos monetizando?
- A experiência continua boa?
- Existe algum risco imediato?
- A Public Beta está evoluindo?

---

# Princípios

O Executive Dashboard deve ser:

- atualizado automaticamente;
- baseado apenas em métricas oficiais;
- derivado dos Data Marts;
- consistente com Product Health;
- consistente com North Star;
- livre de SQL manual.

---

# Arquitetura

```
Analytics Events

        +

Orders

        +

Marketplace Domain

↓

Data Marts

↓

Executive Dashboard

↓

Diretores

Produto

Operações

Negócio
```

---

# Frequência

| Métrica | Atualização |
|-----------|------------|
| North Star | 5 minutos |
| Product Health | 5 minutos |
| Receita | 5 minutos |
| Marketplace | 5 minutos |
| Performance | Tempo quase real |
| Availability | Tempo quase real |
| Cohorts | Diário |
| Funnels | 5 minutos |

---

# Layout

```
──────────────────────────────────────────

North Star

──────────────────────────────────────────

Product Health

Marketplace

Revenue

──────────────────────────────────────────

Buyers

Sellers

Search

Checkout

──────────────────────────────────────────

Performance

Errors

Availability

──────────────────────────────────────────

Funnels

Cohorts

Retention

──────────────────────────────────────────

Alerts

Recommendations

```

---

# 1. North Star

Card principal.

```
Pedidos Concluídos (7 dias)
```

Exibir

Valor atual

Meta

Variação

Tendência

---

KPIs

Pedidos

GMV

Conversão

Ticket Médio

---

# 2. Product Health

Exibir o Product Health Score.

```
0 — 100
```

Também mostrar:

Conversão

Retenção

Performance

Disponibilidade

Satisfação

Uso

---

Cores

95–100

🟢 Excelente

---

80–94

🟡 Atenção

---

<80

🔴 Crítico

---

# 3. Receita

KPIs

GMV

Receita Marketplace

Receita Stripe

Receita Escrow

Pedidos

Ticket Médio

Receita por jogo

Receita por país

Receita por vendedor

---

Gráficos

Receita diária

Receita semanal

Receita mensal

---

# 4. Marketplace

KPIs

Buyers ativos

Sellers ativos

Novos Sellers

Novos Buyers

Liquidez

Ofertas

Cards publicados

Inventário

---

Gráficos

Marketplace Growth

Liquidity

Supply vs Demand

---

# 5. Compradores

KPIs

Novos usuários

Usuários ativos

DAU

WAU

MAU

Retention D1

Retention D7

Retention D30

Lifetime

---

Indicadores

Wishlist

Coleções

Deck Builder

Judge

---

# 6. Sellers

KPIs

Sellers ativos

Listings

Primeira venda

Tempo até primeira venda

Conversão

Retenção

GMV

---

Indicadores

Inventory

Import Wizard

Health

---

# 7. Search

KPIs

Searches

CTR

Zero Results

Tempo médio

Conversão

---

Alertas

CTR baixo

Zero Results

Busca lenta

---

# 8. Checkout

KPIs

Checkout Started

Checkout Completed

Conversão

PIX

Stripe

Cupom

Abandono

---

Indicadores

Erro pagamento

Erro frete

Erro escrow

---

# 9. Performance

KPIs

LCP

CLS

INP

TTFB

FCP

Bundle

---

Targets

LCP

<2s

CLS

<0.05

INP

<200ms

TTFB

<500ms

---

# 10. Disponibilidade

KPIs

API

Frontend

BFF

Search

Checkout

Analytics

---

Targets

99.9%

---

# 11. Qualidade

KPIs

Errors

Warnings

DLQ

Lost Events

Failed Events

Analytics Health

---

Origem

Analytics Runtime

---

# 12. Funis

Cards

Marketplace Funnel

Checkout Funnel

Wishlist Funnel

Seller Funnel

Inventory Funnel

Search Funnel

Judge Funnel

---

Mostrar

Conversão

Abandono

Comparação

---

# 13. Cohorts

Cards

Buyer

Seller

Revenue

Feature

Retention

---

Visualizações

Heatmap

Curvas

Tabelas

---

# 14. Alertas

Mostrar somente alertas ativos.

Exemplos

🔴 Product Health <80

🔴 LCP >2s

🔴 Checkout caiu

🔴 Conversão caiu

🔴 Revenue caiu

🔴 API indisponível

🔴 Analytics Health <75

---

# 15. Recomendações

Motor simples.

Exemplo

```
CTR caiu 18%

↓

Investigar Search
```

---

```
Checkout caiu 11%

↓

Investigar Shipping
```

---

```
Seller Retention caiu

↓

Revisar onboarding
```

---

# Filtros

Período

Hoje

Ontem

7 dias

30 dias

90 dias

Personalizado

---

Segmentações

Marketplace

Jogo

Seller

Buyer

Categoria

País

Origem

Dispositivo

---

# Drill-down

Todo KPI deve abrir:

Dashboard específico

ou

Relatório detalhado.

---

# Permissões

Executivo

Visualização completa

---

Produto

Tudo

---

Operações

Marketplace

Performance

Qualidade

---

Marketing

Aquisição

Funis

Cohorts

---

Financeiro

Receita

GMV

Pedidos

---

# Exportação

PDF

CSV

Excel

Imagem

Link compartilhável

---

# Integração

Este dashboard consome:

- PRODUCT_METRICS.md
- NORTH_STAR.md
- PRODUCT_HEALTH_RUNTIME.md
- FUNNEL_RUNTIME.md
- COHORT_RUNTIME.md

Nenhuma métrica pode ser recalculada localmente.

---

# Alert Engine

O Executive Dashboard deve consumir automaticamente:

Product Health Alerts

Analytics Alerts

Marketplace Alerts

Performance Alerts

Revenue Alerts

Security Alerts

---

# Governança

Todo KPI deve possuir:

- owner;
- documentação;
- definição oficial;
- origem dos dados;
- frequência;
- versão;
- testes automatizados.

Nenhum KPI pode existir sem documentação.

---

# Roadmap

## Beta 2

- Dashboard executivo
- KPIs oficiais
- Product Health
- North Star
- Revenue
- Marketplace

---

## Beta 3

- Forecast
- IA para recomendações
- Benchmark por período
- Comparação entre releases
- Detecção automática de anomalias
- Executive Brief diário

---

# Relação com a arquitetura analítica

```
Analytics Runtime
        │
        ▼
Product Metrics
        │
        ▼
North Star
        │
        ▼
Product Health
        │
        ▼
Funnels
        │
        ▼
Cohorts
        │
        ▼
Executive Dashboard
```

O Executive Dashboard representa a camada final da plataforma analítica, consolidando todas as métricas estratégicas em uma visão única para acompanhamento da evolução do Judge TCG Marketplace durante o Public Beta e futuras versões.