# Product Health Runtime
**Versão:** 1.0  
**Status:** Public Beta  
**Base:** RC1 + Beta 1.5 Event Integrity + Beta 2 Product Analytics Runtime

---

# Objetivo

O **Product Health Runtime (PHR)** é o indicador oficial da saúde operacional do Judge TCG Marketplace.

Enquanto a **North Star Metric** mede o valor entregue ao mercado (Pedidos Concluídos), o Product Health mede **a capacidade da plataforma de continuar gerando esse valor de forma sustentável**.

O Product Health Score (PHS) deve ser calculado continuamente e servir como principal indicador operacional para Product, Engenharia e Operações.

---

# Filosofia

Um marketplace saudável depende simultaneamente de:

- boa experiência do comprador;
- boa experiência do vendedor;
- alta disponibilidade;
- boa performance;
- eventos confiáveis;
- busca eficiente;
- checkout funcionando;
- catálogo atualizado.

Nenhum desses componentes, isoladamente, representa a saúde do produto.

O Product Health agrega todos eles em um único índice.

---

# Product Health Score

```
PHS (0–100)
```

Quanto maior o valor, mais saudável está a plataforma.

Faixas oficiais:

| Score | Status | Ação |
|--------|---------|------|
| 95–100 | Excelente | Operação normal |
| 90–94 | Muito Bom | Monitorar |
| 80–89 | Atenção | Revisar métricas |
| 70–79 | Risco | Plano de mitigação |
| <70 | Crítico | Incidente P1 |

---

# Componentes

O Product Health é composto por oito pilares.

---

## 1. Conversão

Peso

```
25%
```

Objetivo

Garantir que usuários consigam concluir compras.

Indicadores

- Checkout Conversion
- Cart Conversion
- Purchase Success
- Checkout Abandonment

Meta

```
>=95
```

---

## 2. Performance

Peso

```
15%
```

Indicadores

- Lighthouse
- LCP
- CLS
- INP
- TTFB

Metas

| Métrica | Meta |
|----------|------|
| Lighthouse | ≥95 |
| LCP | <2s |
| CLS | <0.05 |
| INP | <200ms |
| TTFB | <500ms |

---

## 3. Disponibilidade

Peso

```
15%
```

Indicadores

- API Availability
- BFF Availability
- Render Health
- Vercel Health

Meta

```
99.9%
```

---

## 4. Confiabilidade

Peso

```
10%
```

Indicadores

- API Error Rate
- BFF Error Rate
- Failed Requests
- Retry Rate

Meta

```
>99%
```

---

## 5. Analytics Health

Peso

```
10%
```

Fonte

ANALYTICS_HEALTH.md

Indicadores

- Persist Ratio
- DLQ Rate
- Duplicate Events
- Schema Errors
- Event Latency

Meta

```
>=90
```

---

## 6. Search Quality

Peso

```
10%
```

Indicadores

- Search Success
- Search CTR
- Zero Results
- Average Search Time

Metas

| Métrica | Meta |
|----------|------|
| Search CTR | >35% |
| Zero Results | <5% |
| Search Latency | <300ms |

---

## 7. Seller Health

Peso

```
7.5%
```

Indicadores

- Sellers ativos
- Primeira venda
- Estoque disponível
- Listings ativos

Meta

Crescimento contínuo.

---

## 8. Buyer Health

Peso

```
7.5%
```

Indicadores

- Buyers ativos
- Retenção
- Wishlist
- Conversão

Meta

Crescimento contínuo.

---

# Fórmula Oficial

```
PHS =

Conversão × 0.25 +

Performance × 0.15 +

Disponibilidade × 0.15 +

Confiabilidade × 0.10 +

Analytics × 0.10 +

Search × 0.10 +

Seller × 0.075 +

Buyer × 0.075
```

Resultado final:

```
0–100
```

---

# Relação com a North Star

A North Star mede:

```
Pedidos Concluídos
```

O Product Health mede:

```
A capacidade da plataforma continuar gerando pedidos.
```

Visualmente

```
                 North Star

          Pedidos Concluídos

                     ▲

              Product Health

                     ▲

 ┌───────────────┬───────────────┐

Performance   Analytics   Checkout

Search        Seller      Buyer

Disponibilidade Confiabilidade
```

---

# Atualização

Refresh

Tempo real.

Dashboards

5 minutos.

Alertas

Tempo real.

---

# Dashboards

Executive

Product Health

Marketplace

Operations

Engineering

Analytics

---

# Alertas

Gerar automaticamente quando:

## Crítico

PHS <70

Abrir incidente P1.

---

## Alto

PHS entre 70–80

Notificar Engenharia.

---

## Médio

PHS entre 80–90

Notificar Product.

---

## Informativo

PHS >95

Registrar estabilidade.

---

# Drill Down

O dashboard deve permitir decompor o Product Health.

Exemplo

```
Product Health

94

↓

Performance

98

↓

Checkout

99

↓

Analytics

97

↓

Search

82
```

Assim é possível identificar rapidamente o componente degradado.

---

# Tendência

Além do valor absoluto, acompanhar:

Últimas 24 horas

Últimos 7 dias

Últimos 30 dias

Média móvel

Tendência

- Melhorando
- Estável
- Piorando

---

# Dependências

O Product Health depende de:

- PRODUCT_METRICS.md
- NORTH_STAR.md
- ANALYTICS_HEALTH.md
- FUNNEL_RUNTIME.md
- COHORT_RUNTIME.md

---

# Uso no Roadmap

Toda Sprint deve informar:

- Impacto esperado no Product Health.
- Componentes afetados.
- Score esperado antes/depois.

Exemplo

| Sprint | Antes | Depois |
|---------|-------|---------|
| Sprint 18.5 | 82 | 90 |
| Sprint 19 | 90 | 94 |
| RC1.1 | 94 | 97 |

---

# Critérios de Release

Uma Release Candidate somente poderá ser aprovada quando:

- Product Health ≥90
- Analytics Health ≥90
- Lighthouse ≥95
- Conversão estável
- API Availability ≥99.9%
- Nenhum incidente P1 aberto

---

# Governança

O cálculo do Product Health deve existir em apenas um lugar da plataforma.

Nenhum dashboard poderá recalcular seus pesos localmente.

Toda alteração de pesos exige:

1. Aprovação do Product Owner.
2. Aprovação da Arquitetura.
3. Atualização deste documento.
4. Atualização de PRODUCT_METRICS.md.
5. Atualização dos dashboards.
6. Registro no CHANGELOG.

---

# Roadmap

## Public Beta

- Product Health Runtime
- Dashboards executivos
- Alertas automáticos

## Beta 2

- Tendências e comparação histórica
- Breakdown por categoria de TCG
- Score por região
- Score por seller

## Beta 3

- Predição de degradação
- Detecção automática de anomalias
- Recomendações por IA
- Simulação de impacto de releases

---

# Resumo

O **Product Health Runtime** é o principal indicador operacional do Judge TCG Marketplace.

Ele consolida conversão, performance, disponibilidade, confiabilidade, analytics, busca, compradores e vendedores em um único score (0–100), permitindo que Produto, Engenharia e Operações acompanhem continuamente a saúde da plataforma e tomem decisões baseadas em dados consistentes.
---

## Beta 2 Implementation Note

Runtime implementado em `services/api/app/analytics_runtime/`.

- Materializa Data Marts; dashboards internos via `GET /runtime/*`.
- Metric Engine: `registry/metrics.py` (validate_registry).
- Relatório: `docs/product/BETA2_RUNTIME_REPORT.md` · `context/beta2-product-analytics-runtime.md`.
