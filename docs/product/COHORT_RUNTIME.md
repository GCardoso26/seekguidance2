 # Cohort Runtime
**Versão:** 1.0  
**Status:** Public Beta  
**Base:** RC1 + Beta 1.5 Event Integrity + Beta 2 Product Analytics Runtime

---

# Objetivo

O **Cohort Runtime** define a implementação oficial das análises de retenção, recorrência, ativação e comportamento longitudinal do Judge TCG Marketplace.

Enquanto:

- **Product Metrics** define as métricas oficiais;
- **Funnel Runtime** identifica perdas na jornada;
- **North Star** mede geração de valor;
- **Product Health Runtime** mede saúde operacional;

o Cohort Runtime responde:

> **"Os usuários continuam obtendo valor ao longo do tempo?"**

---

# Filosofia

Marketplaces não crescem apenas adquirindo novos usuários.

O crescimento sustentável acontece quando:

- compradores retornam;
- vendedores permanecem ativos;
- ambos continuam transacionando.

Por isso, retenção possui prioridade igual à aquisição.

---

# Arquitetura

```
Analytics Events

        +

Orders

        +

Marketplace Domain

↓

Cohort Engine

↓

Materialized Views

↓

Dashboards

↓

Product Health

↓

North Star
```

As análises de cohort **não** devem ser calculadas diretamente sobre eventos brutos.

---

# Tipos Oficiais de Cohort

O sistema suporta cinco famílias de cohort.

---

# 1. Acquisition Cohort

Agrupa usuários pela primeira entrada.

Exemplos

```
Primeira compra

Primeiro login

Primeiro cadastro

Primeira venda

Primeira wishlist
```

Exemplo

```
Janeiro 2027

↓

Todos usuários que entraram em janeiro.
```

---

# 2. Behavioral Cohort

Agrupa usuários por comportamento.

Exemplos

```
Criou Wishlist

↓

Comprou via Wishlist

↓

Nunca voltou
```

Outro exemplo

```
Usuários que usam Deck Builder

↓

Usuários que usam Judge

↓

Usuários Mobile
```

---

# 3. Revenue Cohort

Agrupa usuários por receita.

Exemplo

```
GMV

0-100

100-500

500-2000

2000+
```

---

# 4. Seller Cohort

Agrupa vendedores.

Exemplos

```
Primeiro anúncio

Primeira venda

100 anúncios

100 vendas
```

---

# 5. Feature Cohort

Agrupa usuários que utilizaram funcionalidades.

Exemplos

Wishlist

Deck Builder

Judge

Coleção

Inventory

Import Wizard

---

# Granularidade

Todos os cohorts suportam:

Diário

Semanal

Mensal

Rolling 30 dias

Rolling 90 dias

---

# Métricas Oficiais

---

## Retention

```
Usuários ativos

/

Usuários da Cohort
```

---

## Churn

```
Usuários perdidos

/

Usuários da Cohort
```

---

## Reactivation

```
Usuário voltou

após

30 dias inativo
```

---

## Stickiness

```
DAU

/

MAU
```

---

## Lifetime

Tempo médio de permanência.

---

## Orders Per User

```
Pedidos

/

Usuários
```

---

## GMV Per User

```
GMV

/

Usuário
```

---

## Revenue Retention

```
GMV período N

/

GMV período 0
```

---

# Buyer Cohorts

Principais análises

## Cadastro

```
Cadastro

↓

Primeira busca

↓

Primeira compra

↓

Compra recorrente
```

---

## Wishlist

```
Wishlist criada

↓

Wishlist utilizada

↓

Compra
```

---

## Deck Builder

```
Deck criado

↓

Deck salvo

↓

Deck Shop

↓

Compra
```

---

## Coleção

```
Coleção criada

↓

Atualização

↓

Compra
```

---

# Seller Cohorts

## Onboarding

```
Cadastro

↓

KYC

↓

Primeiro anúncio

↓

Primeira venda
```

---

## Inventory

```
Import

↓

Produtos ativos

↓

Venda
```

---

## Growth

```
1 venda

↓

10 vendas

↓

50 vendas

↓

100 vendas
```

---

# Marketplace Cohorts

Análises

Compradores recorrentes

Vendedores recorrentes

Liquidez

Tempo entre compras

Tempo entre vendas

---

# Search Cohorts

Agrupar usuários por:

Uso da busca

Autocomplete

Filtros

Zero Results

---

# Judge Cohorts

Agrupar usuários por:

Regras consultadas

Tempo de resolução

Uso recorrente

---

# Segmentações

Todo cohort deve aceitar:

---

## Jogo

Magic

Pokémon

Yu-Gi-Oh!

Lorcana

One Piece

Digimon

Dragon Ball

Star Wars Unlimited

Gundam

Outros

---

## Plataforma

Desktop

Mobile

Tablet

---

## País

Brasil

Europa

Estados Unidos

Outros

---

## Origem

SEO

Google

Campanhas

Referral

Direto

---

## Seller

Marketplace

Loja

Categoria

---

# Dashboards

Buyer Cohort

Seller Cohort

Marketplace Cohort

Revenue Cohort

Retention Dashboard

Product Dashboard

Executive Dashboard

---

# Alertas

Gerar alerta quando:

Retention D7 cair >10%

Retention D30 cair >15%

Churn subir >10%

Seller Retention cair >10%

Revenue Retention cair >15%

Stickiness cair >15%

---

# Integração com Product Health

Os seguintes componentes alimentam o Product Health Score:

Buyer Retention

Seller Retention

Revenue Retention

Stickiness

Reactivation

---

# Integração com North Star

A North Star mede:

```
Pedidos concluídos
```

Os cohorts respondem:

```
Quem continua gerando esses pedidos?
```

Visualmente

```
Aquisição

↓

Ativação

↓

Retenção

↓

Compra

↓

Compra recorrente

↓

North Star
```

---

# Integração com Funnel Runtime

Funis mostram:

```
Onde perdeu.
```

Cohorts mostram:

```
Quem voltou.
```

Os dois documentos são complementares.

---

# Materialized Views

Recomendação de marts:

```
buyer_cohort_daily

seller_cohort_daily

feature_cohort_daily

revenue_cohort_daily

retention_daily
```

Refresh

5 minutos

---

# Atualização

Near Real Time

até 5 minutos

---

# Versionamento

Todo cohort possui:

```
cohort_version
```

Formato

```
1.0
```

Mudanças incompatíveis:

```
2.0
```

---

# Governança

Nenhum dashboard poderá:

- recalcular cohorts;
- criar retenções diferentes;
- alterar fórmulas;
- utilizar SQL próprio.

Toda nova análise deve possuir:

- owner;
- documentação;
- métricas;
- dashboards;
- testes;
- versionamento;
- alertas.

---

# Roadmap

## Beta 2

- Runtime oficial
- Dashboards
- Retenção D1/D7/D30
- Revenue Cohorts

---

## Beta 3

- Predição de churn
- IA para retenção
- Recomendações automáticas
- Segmentação inteligente
- Cohorts por campanhas
- Cohorts por coleções

---

# Relação com os demais documentos

```
PRODUCT_METRICS.md
        │
        ▼
NORTH_STAR.md
        │
        ▼
PRODUCT_HEALTH_RUNTIME.md
        │
        ▼
FUNNEL_RUNTIME.md
        │
        ▼
COHORT_RUNTIME.md
```

Cada documento responde uma pergunta diferente:

| Documento | Pergunta |
|-----------|----------|
| PRODUCT_METRICS | O que medir? |
| NORTH_STAR | Qual é o principal objetivo do produto? |
| PRODUCT_HEALTH_RUNTIME | O produto está saudável? |
| FUNNEL_RUNTIME | Onde estamos perdendo usuários? |
| COHORT_RUNTIME | Quem continua retornando e gerando valor? |

---

# Resumo

O **Cohort Runtime** estabelece a implementação oficial das análises de retenção do Judge TCG Marketplace. Ele permite acompanhar a evolução de compradores, vendedores e funcionalidades ao longo do tempo, identificar padrões de recorrência, antecipar churn e medir o valor gerado por diferentes grupos de usuários. Em conjunto com o Funnel Runtime, Product Health e North Star, forma a base analítica para evolução contínua do produto durante o Public Beta e futuras versões.