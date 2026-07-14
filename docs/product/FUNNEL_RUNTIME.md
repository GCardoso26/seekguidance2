 # Funnel Runtime
**Versão:** 1.0  
**Status:** Public Beta  
**Base:** RC1 + Beta 1.5 Event Integrity + Beta 2 Product Analytics Runtime

---

# Objetivo

O **Funnel Runtime** define como o Judge TCG Marketplace mede, calcula e monitora os principais fluxos de conversão do produto.

Enquanto o **Product Metrics** define *o que medir* e o **North Star** define *o objetivo final*, o Funnel Runtime responde:

> **"Onde os usuários estão abandonando a jornada?"**

Todo funil é calculado automaticamente a partir dos eventos persistidos e serve como fonte oficial para dashboards, alertas, Product Health e experimentos.

---

# Princípios

Todo funil deve:

- possuir owner;
- possuir eventos oficiais registrados no Event Registry;
- utilizar apenas eventos persistidos;
- possuir versão;
- permitir análise histórica;
- possuir taxa de conversão por etapa;
- possuir taxa de abandono por etapa;
- permitir segmentação por período, dispositivo, país, jogo e usuário.

---

# Arquitetura

```
Usuário

↓

Evento

↓

Analytics Gateway

↓

analytics_events

↓

Data Mart

↓

Funnel Runtime

↓

Dashboards

↓

Alert Engine

↓

Product Health
```

Nenhum dashboard poderá calcular funis diretamente sobre `analytics_events`.

---

# Marketplace Funnel

## Objetivo

Medir a jornada principal de compra.

Fluxo

```
Landing

↓

Search

↓

Card View

↓

Offer View

↓

Add To Cart

↓

Checkout Started

↓

Purchase Completed
```

---

## Eventos

| Etapa | Evento |
|--------|---------|
| Landing | page_view |
| Search | search |
| Card | card_view |
| Oferta | offer_view |
| Carrinho | add_to_cart |
| Checkout | checkout_started |
| Compra | purchase_completed |

---

## Conversões

Landing → Search

```
search

/

landing
```

---

Search → Card

```
card_view

/

search
```

---

Card → Oferta

```
offer_view

/

card_view
```

---

Oferta → Carrinho

```
add_to_cart

/

offer_view
```

---

Carrinho → Checkout

```
checkout_started

/

add_to_cart
```

---

Checkout → Compra

```
purchase_completed

/

checkout_started
```

---

Conversão Total

```
purchase_completed

/

landing
```

---

# Wishlist Funnel

## Objetivo

Medir quanto a Wishlist influencia vendas.

Fluxo

```
Wishlist Visit

↓

Wishlist Created

↓

Item Added

↓

Wishlist Shared

↓

Card View

↓

Add To Cart

↓

Purchase
```

---

Eventos

- wishlist_visited
- wishlist_created
- wishlist_item_added
- wishlist_shared
- card_view
- add_to_cart
- purchase_completed

---

KPIs

Wishlist Conversion

Wishlist Engagement

Wishlist Share Rate

Wishlist Revenue

Wishlist Assisted Revenue

---

# Search Funnel

## Objetivo

Medir eficiência da busca.

Fluxo

```
Search

↓

Autocomplete

↓

Result Click

↓

Card View

↓

Purchase
```

---

KPIs

Search CTR

Search Success

Zero Results

Search Conversion

Average Search Time

---

# Checkout Funnel

## Objetivo

Encontrar abandono financeiro.

Fluxo

```
Checkout Started

↓

Shipping Selected

↓

Payment Selected

↓

Payment Authorized

↓

Purchase Completed
```

---

KPIs

Checkout Conversion

PIX Conversion

Stripe Conversion

Abandonment

Payment Failure

Coupon Usage

---

# Seller Funnel

## Objetivo

Medir ativação de vendedores.

Fluxo

```
Cadastro

↓

KYC

↓

Primeiro Login

↓

Primeiro Listing

↓

Primeira Venda

↓

Retenção
```

---

Eventos

seller_signup

seller_kyc_completed

seller_login

listing_create

purchase_completed

---

KPIs

Activation Rate

Time To First Listing

Time To First Sale

Seller Retention

Listing Conversion

---

# Inventory Funnel

Fluxo

```
Import

↓

Processing

↓

Published

↓

Available

↓

Purchased
```

---

KPIs

Import Success

Inventory Freshness

Availability

Out Of Stock

Inventory Conversion

---

# Deck Builder Funnel

Fluxo

```
Deck Builder Open

↓

Card Added

↓

Deck Saved

↓

Deck Shop

↓

Purchase
```

---

KPIs

Deck Completion

Deck Shop CTR

Deck Purchase Conversion

---

# Judge Funnel

Fluxo

```
Rule Search

↓

Judge Answer

↓

Copy

↓

Share
```

---

KPIs

Rule Resolution Rate

Average Resolution Time

Share Rate

---

# Cohort Support

Todo funil deve suportar:

- 24 horas
- 7 dias
- 30 dias
- 90 dias
- Rolling Window

Segmentações:

- Buyer
- Seller
- Guest
- Novo usuário
- Usuário recorrente

---

# Segmentações

Todo funil deve aceitar filtros por:

## Produto

- Card
- Set
- Categoria

---

## Marketplace

- Seller
- Loja

---

## Jogos

- Magic
- Pokémon
- Lorcana
- One Piece
- Yu-Gi-Oh!
- Star Wars Unlimited
- Digimon
- Gundam
- Dragon Ball
- Flesh and Blood
- Outros

---

## Plataforma

Desktop

Tablet

Mobile

---

## Origem

SEO

Google

Direto

Social

Campanhas

Referral

---

# Dashboards

Executive Funnel

Marketplace Funnel

Search Funnel

Wishlist Funnel

Seller Funnel

Checkout Funnel

Inventory Funnel

Judge Funnel

---

# Alertas

Gerar alerta quando:

Landing → Search cair >10%

Search CTR cair >15%

Card → Cart cair >15%

Checkout → Purchase cair >10%

Wishlist Conversion cair >20%

Seller Activation cair >15%

Search Zero Results subir >5%

---

# Versionamento

Cada funil possui:

```
funnel_version
```

Formato

```
1.0
```

Mudanças incompatíveis exigem:

```
2.0
```

---

# Governança

Nenhum dashboard poderá:

- recalcular etapas;
- alterar eventos;
- ignorar etapas oficiais;
- criar funis paralelos.

Todo novo funil deverá possuir:

- owner;
- documentação;
- eventos registrados;
- testes automatizados;
- métricas oficiais;
- dashboard;
- alertas;
- versionamento.

---

# Relação com o Product Health

Os seguintes componentes alimentam diretamente o Product Health Score:

- Marketplace Funnel
- Search Funnel
- Checkout Funnel
- Seller Funnel
- Wishlist Funnel

Degradações nesses funis impactam automaticamente o **Product Health Runtime**.

---

# Relação com a North Star

A North Star (Pedidos Concluídos) representa a saída final dos funis.

```
Marketplace Funnel

↓

Checkout Funnel

↓

Purchase Completed

↓

North Star
```

O objetivo do Funnel Runtime é identificar exatamente em qual etapa a conversão foi perdida antes de afetar a North Star.

---

# Roadmap

## Beta 2

- Runtime de funis
- Dashboards
- Conversões por etapa
- Alertas automáticos

## Beta 3

- Comparação entre versões
- Funis por experimento
- Heatmaps por etapa
- Predição de abandono
- Recomendações automáticas por IA

---

# Resumo

O **Funnel Runtime** estabelece a implementação oficial dos funis do Judge TCG Marketplace, transformando eventos persistidos em jornadas de conversão mensuráveis. Ele permite identificar perdas de conversão, acompanhar a evolução dos principais fluxos do produto, alimentar dashboards e alertas operacionais, além de servir como base para o **Product Health Score**, a **North Star Metric** e futuras iniciativas de Product Intelligence.