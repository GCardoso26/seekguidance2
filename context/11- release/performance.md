 # context/11-release/performance.md

# Performance Strategy

**Version:** 1.0  
**Status:** Active  
**Owner:** Platform Engineering  
**Context:** Release & Platform Performance

---

# Objetivo

Este documento define a estratégia oficial de Performance do JudgeTCG.

Performance não é uma otimização feita ao final do projeto.

Ela é um requisito arquitetural presente desde a concepção dos Bounded Contexts, APIs, Frontend, Catálogo, Marketplace e plataforma de IA.

Toda funcionalidade deve possuir metas mensuráveis de desempenho.

---

# Princípios

A plataforma deve priorizar:

- baixa latência
- escalabilidade horizontal
- isolamento entre contextos
- cache inteligente
- processamento assíncrono
- observabilidade
- previsibilidade

---

# Objetivos

Os objetivos oficiais são:

- marketplace responsivo
- busca instantânea
- painel do vendedor fluido
- catálogo extremamente rápido
- IA com baixa latência
- APIs previsíveis
- deploy sem degradação

---

# Arquitetura

```mermaid
flowchart TD

Client

↓

CDN

↓

Next.js

↓

BFF

↓

API

↓

Application

↓

Read Models

↓

Database

↓

Redis
```

---

# Camadas de Performance

```
Frontend

↓

CDN

↓

BFF

↓

Application Layer

↓

Read Models

↓

Database

↓

Infrastructure
```

Cada camada possui metas próprias.

---

# SLOs Oficiais

| Área | Meta |
|--------|------|
| Home | < 1.5 s |
| Marketplace | < 2 s |
| Busca | < 500 ms |
| Catálogo | < 800 ms |
| Dashboard Seller | < 2 s |
| Dashboard Buyer | < 2 s |
| APIs | < 300 ms (P95) |
| Checkout | < 3 s |
| IA (Brief) | < 4 s |
| IA (Insights) | < 5 s |

---

# Frontend Performance

## Objetivos

- First Contentful Paint rápido
- baixa hidratação
- navegação instantânea
- poucas requisições

---

## Estratégias

- React Server Components
- Streaming
- Suspense
- Lazy Loading
- Dynamic Imports
- Route Segmentation

---

## Code Splitting

Todo módulo pesado deve ser carregado sob demanda.

Exemplo:

```
Marketplace

↓

Busca

↓

Painel Seller

↓

Judge

↓

Admin
```

Nunca carregar toda a aplicação no primeiro acesso.

---

# Imagens

Todas as imagens devem utilizar:

- Next Image
- Lazy Loading
- WebP/AVIF
- Responsividade
- Placeholder Blur
- CDN

---

## Objetivos

| Item | Meta |
|--------|------|
| Thumbnail | < 100 KB |
| Carta Full | < 300 KB |
| Hero | < 500 KB |

---

# Catálogo

O Catálogo é um dos pontos mais acessados da plataforma.

Estratégias:

- ISR
- Read Models
- Cache Redis
- CDN
- Lazy Images

---

## Meta

```
Detalhe da carta

↓

< 800 ms
```

---

# Busca

Global Search utiliza:

- debounce
- cache
- providers paralelos
- AbortController
- ranking local

Objetivo:

```
Resposta percebida

↓

< 200 ms

Resposta completa

↓

< 500 ms
```

---

# Marketplace

Todas as páginas públicas devem utilizar:

- ISR
- CDN
- Cache-Control
- Read Models

Nunca consultar múltiplos agregados durante renderização.

---

# Painel do Vendedor

O Seller Dashboard utiliza:

- widgets independentes
- carregamento paralelo
- skeletons
- streaming
- cache

Nenhum widget deve bloquear os demais.

---

# Command Center

As filas operacionais devem utilizar:

- snapshots
- projeções
- leitura direta
- polling leve

Nunca consultas complexas em tempo real.

---

# Buyer Dashboard

Mesmo princípio do Seller Dashboard.

Widgets independentes.

Cache.

Carregamento paralelo.

---

# APIs

Toda API deve seguir:

```
Request

↓

Authentication

↓

Application Service

↓

Read Model

↓

Response
```

Nunca executar lógica pesada em Controllers.

---

# Banco de Dados

Boas práticas:

- índices
- paginação
- projections
- views materializadas
- consultas parametrizadas

Evitar:

- SELECT *
- JOINs excessivos
- consultas N+1

---

# Cache

Hierarquia oficial.

```
Browser

↓

CDN

↓

Redis

↓

Application Cache

↓

Database
```

---

## TTL sugeridos

| Recurso | TTL |
|-----------|------|
| Cartas | 24 h |
| Expansões | 24 h |
| Catálogo | 1 h |
| Dashboard | 30 s |
| Search | 5 min |
| Reputação | 10 min |
| Analytics | 15 min |

---

# Redis

Utilizado para:

- cache
- sessões
- rate limit
- filas
- snapshots
- search

---

# Processamento Assíncrono

Nunca executar em requisições HTTP:

- analytics
- IA pesada
- rebuilds
- scoring
- recomputação

Fluxo:

```
HTTP

↓

Queue

↓

Worker

↓

Projection
```

---

# IA

Estratégias:

- Prompt Compression
- Cache
- Recommendation Engine
- Context Ranking
- Provider Routing

Objetivos:

- reduzir tokens
- reduzir custo
- reduzir latência

---

# Métricas

## Backend

- Latência
- Throughput
- CPU
- Memória
- Filas
- Queries

---

## Frontend

- LCP
- CLS
- INP
- FCP
- TTFB

---

## IA

- Tokens
- Latência
- Cache Hit
- Custo
- Tempo de contexto

---

# Core Web Vitals

| Métrica | Meta |
|----------|------|
| LCP | < 2.5 s |
| CLS | < 0.1 |
| INP | < 200 ms |
| FCP | < 1.8 s |
| TTFB | < 800 ms |

---

# Benchmark

Comparação desejada.

| Plataforma | Referência |
|-------------|------------|
| Shopify Admin | Dashboard |
| Stripe Dashboard | KPIs |
| Linear | Navegação |
| CardTrader | Marketplace |
| MYP Cards | Catálogo |
| LigaMagic | Busca |

O objetivo não é copiar interfaces, mas atingir o mesmo nível de fluidez.

---

# Testes de Performance

Toda release executa:

- Load Test
- Stress Test
- Spike Test
- Soak Test
- Frontend Benchmark
- Lighthouse

---

# Critérios de Aprovação

A release falha caso:

- APIs acima do SLO
- aumento de erro > 5%
- regressão de Core Web Vitals
- aumento de bundle > 15%
- degradação perceptível

---

# KPIs

| KPI | Meta |
|------|------|
| API P95 | < 300 ms |
| API P99 | < 800 ms |
| Cache Hit | > 90% |
| Search | < 500 ms |
| Dashboard | < 2 s |
| Catálogo | < 800 ms |
| Build | Sem regressão |

---

# Performance Budget

## Frontend

| Item | Limite |
|--------|---------|
| JS inicial | < 250 KB |
| CSS | < 100 KB |
| Fonts | < 150 KB |
| Hero Images | < 500 KB |

---

## Backend

- consultas indexadas
- máximo 100 ms por query crítica
- sem N+1
- paginação obrigatória

---

# Anti-patterns

Nunca:

❌ Consultar múltiplos agregados em páginas públicas

❌ Fazer JOINs pesados para dashboards

❌ Executar IA síncrona em páginas críticas

❌ Bloquear renderização esperando APIs secundárias

❌ Recarregar páginas completas

❌ Carregar imagens originais

❌ Executar analytics em tempo real na mesma requisição

---

# ADRs

## ADR-001

Read Models são obrigatórios para dashboards.

---

## ADR-002

Catálogo utiliza ISR.

---

## ADR-003

Marketplace prioriza cache.

---

## ADR-004

Widgets carregam em paralelo.

---

## ADR-005

Processamento pesado ocorre via filas.

---

## ADR-006

Performance é validada em toda release.

---

## ADR-007

Core Web Vitals fazem parte do processo de aprovação.

---

## ADR-008

Performance Budgets são tratados como contratos arquiteturais.

---

# Roadmap

## Atual

- ISR
- Redis
- Read Models
- Streaming
- Skeletons
- Cache CDN
- Search paralela

## Futuro

- Edge Rendering
- Partial Prerendering (PPR)
- HTTP/3
- Redis Cluster
- Virtualização completa
- Predictive Prefetch
- AI Cache Optimization
- Adaptive Image Pipeline
- Edge Search
- Real User Monitoring (RUM)

---

# Integração com a Arquitetura

```text
Browser
    │
    ▼
CDN
    │
    ▼
Next.js (RSC / ISR / Streaming)
    │
    ▼
BFF
    │
    ▼
Application Services
    │
    ├──────── Read Models
    ├──────── Redis
    └──────── Queue
             │
             ▼
        PostgreSQL
```

---

# Conclusão

A estratégia de Performance do JudgeTCG estabelece metas objetivas para todas as camadas da plataforma.

Ao combinar React Server Components, ISR, Redis, Read Models, processamento assíncrono, cache multinível e budgets de performance, a plataforma garante uma experiência consistente para compradores, vendedores, juízes e administradores, mesmo com crescimento contínuo do catálogo, do marketplace e das funcionalidades de IA.