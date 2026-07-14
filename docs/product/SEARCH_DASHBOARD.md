 # Search Dashboard
**Versão:** 1.0  
**Status:** Public Beta  
**Base:** RC1 + Beta 2 Product Analytics Runtime

---

# Objetivo

O **Search Dashboard** é o centro de inteligência do mecanismo de busca do Judge TCG Marketplace.

Seu objetivo é transformar a busca em um produto orientado por dados, permitindo monitorar:

- qualidade dos resultados;
- comportamento dos usuários;
- oportunidades de indexação;
- eficiência dos algoritmos;
- impacto da busca na conversão do marketplace.

A busca é o principal ponto de entrada do marketplace e deve ser tratada como um produto próprio.

---

# Missão

Responder continuamente:

- O usuário encontrou o que procurava?
- A busca gerou venda?
- Existem consultas sem resultado?
- Quais cartas são mais procuradas?
- Quais filtros prejudicam conversão?
- Existe problema de relevância?

---

# Arquitetura

```
Search Query

↓

Search Runtime

↓

Analytics Gateway

↓

Product Analytics Runtime

↓

Search Dashboard

↓

KPIs

↓

Insights

↓

Melhorias
```

---

# Layout Geral

```
────────────────────────────────────────────

Resumo da Busca

────────────────────────────────────────────

KPIs

CTR

Conversão

Zero Results

────────────────────────────────────────────

Top Buscas

Top Cartas

Top Jogos

────────────────────────────────────────────

Search Quality

Ranking

Relevância

────────────────────────────────────────────

Funil

Insights

Alertas

```

---

# 1. Resumo Executivo

Mostrar

```
Hoje

92.418 buscas

CTR

67%

Conversão

14%

Zero Results

2,1%

```

---

Comparação

Hoje

Ontem

7 dias

30 dias

---

# 2. KPIs Oficiais

## Total de buscas

Quantidade

Únicas

Repetidas

---

## CTR

```
Card Click

/

Searches
```

---

## Conversão

```
Pedidos

/

Searches
```

---

## Zero Results

```
Consultas

sem resultado

```

---

## Refinamentos

Quantidade

Filtros usados

Nova pesquisa

---

## Tempo até clique

Mediana

P95

---

## Tempo até compra

Busca

↓

Compra

---

# 3. Funil da Busca

```
Busca

↓

Resultados

↓

Clique

↓

Produto

↓

Carrinho

↓

Checkout

↓

Compra
```

Mostrar

Conversão por etapa

Abandono

Tempo

---

# 4. Top Buscas

Tabela

Consulta

Quantidade

CTR

Conversão

Zero Result

---

Exemplos

```
Black Lotus

```

```
Charizard

```

```
Lightning Bolt

```

---

# 5. Zero Results

Tabela

Consulta

Quantidade

Última ocorrência

Jogo

Idioma

---

Classificação

Erro de digitação

Produto inexistente

Produto indisponível

Indexação

---

Ações

Adicionar sinônimo

Criar alias

Importar catálogo

---

# 6. Search Quality

KPIs

CTR

Conversão

Bounce

Tempo

Scroll

---

Indicador

```
Search Health Score

98

Excelente
```

---

# 7. Ranking

Monitorar

Posição média

CTR por posição

Conversão

Relevância

---

Tabela

Produto

Posição

CTR

Conversão

---

# 8. Jogos

Magic

Pokémon

Yu-Gi-Oh!

Lorcana

One Piece

Digimon

Dragon Ball

Star Wars Unlimited

---

KPIs

Buscas

CTR

Conversão

Zero Results

---

# 9. Filtros

Uso

Preço

Idioma

Foil

Condição

Coleção

Loja

---

KPIs

Mais utilizados

Conversão

Abandono

---

# 10. Marketplace

Quais lojas aparecem mais

CTR

Conversão

Produtos

Estoque

---

Mostrar

Top Sellers

---

# 11. Cartas

KPIs

Mais pesquisadas

Mais clicadas

Mais compradas

Maior crescimento

---

Mostrar

Trending

---

# 12. Performance

Tempo resposta

P50

P95

P99

---

Indexação

Tempo

Falhas

Atualizações

---

# 13. Relevância

Monitorar

CTR

Conversão

Scroll

Tempo

Bounce

---

Objetivo

Detectar

Resultados ruins

---

# 14. Search Suggestions

KPIs

Uso

CTR

Conversão

---

Top sugestões

Autocomplete

Recentes

Relacionadas

---

# 15. Search Insights

Detectar

Buscas emergentes

Jogos crescendo

Sets novos

Cartas populares

---

Exemplo

```
Edge of Eternities

+380%

últimos 7 dias
```

---

# 16. Alertas

🟢 Busca crescendo

🟡 Zero Results aumentando

🔴 Índice desatualizado

🔴 CTR caiu

🟡 Conversão caiu

---

# 17. IA (Beta 3)

Preparado para

Correção automática

Sinônimos

Autocomplete IA

Ranking IA

Embeddings

Busca semântica

Recomendação híbrida

---

# 18. Dashboards Relacionados

Executive Dashboard

Marketplace Dashboard

Buyer Dashboard

Seller Dashboard

Analytics Dashboard

---

# Filtros

Período

Hoje

7 dias

30 dias

90 dias

Ano

---

Jogos

Magic

Pokémon

Yu-Gi-Oh!

Lorcana

One Piece

Digimon

Dragon Ball

Star Wars Unlimited

---

Idioma

Português

Inglês

Japonês

---

Origem

Desktop

Mobile

API

---

# Exportação

CSV

Excel

PDF

Compartilhar

---

# Atualização

Search Runtime

Tempo quase real

---

Analytics

5 minutos

---

Dashboards

5 minutos

---

# Product Analytics Runtime

Eventos consumidos

```
search_started

search_results

search_zero_results

search_refined

search_suggestion_clicked

card_view

offer_view

offer_clicked

add_to_cart

checkout_started

purchase_completed
```

---

# KPIs Oficiais

Searches

CTR

Conversion Rate

Zero Results Rate

Average Click Position

Median Time to Click

Median Time to Purchase

Search Revenue

Revenue per Search

Revenue per Query

---

# Search Health Score (SHS)

```
CTR

30%

+

Conversão

30%

+

Zero Results

20%

+

Latência

10%

+

Refinamentos

10%
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

# Governança

Toda métrica deve possuir

- owner
- definição
- origem
- documentação
- versão
- testes

---

# Roadmap

## Beta 2

- Dashboard operacional
- KPIs
- Funil
- Search Health
- Zero Results
- Ranking

---

## Beta 3

- Busca semântica
- Embeddings
- Query Intelligence
- IA para ranking
- Sinônimos automáticos
- Correção ortográfica
- Personalized Search
- Search Copilot

---

# Integração

Este dashboard utiliza diretamente

- PRODUCT_METRICS.md
- NORTH_STAR.md
- PRODUCT_HEALTH_RUNTIME.md
- FUNNEL_RUNTIME.md
- COHORT_RUNTIME.md
- EXECUTIVE_DASHBOARD.md

Nenhuma métrica deve ser recalculada no frontend.

---

# Relação com a North Star

A busca influencia diretamente:

- Pedidos concluídos
- Conversão do marketplace
- Descoberta de produtos
- Liquidez do catálogo
- Receita por sessão
- Receita por usuário

Melhorias na Search Health tendem a impactar positivamente a North Star Metric, aumentando a probabilidade de compra e reduzindo o abandono durante a descoberta de produtos.

---

# Resumo

O **Search Dashboard** é o centro de observabilidade e evolução do mecanismo de busca do Judge TCG Marketplace. Ele monitora qualidade, relevância, performance e impacto financeiro da pesquisa, transformando milhões de consultas em indicadores acionáveis para otimizar a experiência do comprador e aumentar a conversão do marketplace durante o Public Beta e nas próximas versões.