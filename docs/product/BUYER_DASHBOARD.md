 # Buyer Dashboard
**Versão:** 1.0  
**Status:** Public Beta  
**Base:** RC1 + Beta 2 Product Analytics Runtime

---

# Objetivo

O **Buyer Dashboard** é o painel principal do comprador dentro do Judge TCG Marketplace.

Seu propósito é transformar a experiência do comprador em um verdadeiro **hub pessoal de coleção, compras e descoberta**, permitindo acompanhar atividades, wishlist, decks, pedidos, coleção e oportunidades do marketplace.

O dashboard deve responder diariamente:

- O que mudou desde minha última visita?
- Existe alguma carta que caiu de preço?
- Alguma wishlist ficou disponível?
- Como evoluiu minha coleção?
- Tenho pedidos em andamento?
- Existem ofertas interessantes para meus decks?

---

# Princípios

O Buyer Dashboard deve ser:

- extremamente rápido;
- altamente personalizado;
- orientado por dados;
- baseado em eventos reais do Product Analytics Runtime;
- preparado para IA e recomendações futuras.

---

# Arquitetura

```
Marketplace

+

Orders

+

Wishlist

+

Collections

+

Deck Builder

+

Analytics Runtime

↓

Buyer Dashboard

↓

Insights

↓

Ações

↓

Conversão
```

---

# Layout Geral

```
────────────────────────────────────────────

Resumo Diário

────────────────────────────────────────────

KPIs

Pedidos

Coleção

Wishlist

Decks

────────────────────────────────────────────

Atividades

Recomendações

Ofertas

────────────────────────────────────────────

Pedidos

Wishlist

Coleção

────────────────────────────────────────────

Analytics

Marketplace

Insights

```

---

# 1. Resumo Diário

Exibir

```
Olá Guilherme!

Hoje encontramos:

12 novas cartas

3 reduções de preço

1 pedido enviado

```

Também mostrar

Wishlist atendidas

Pedidos

Economia

Novas ofertas

---

# 2. KPIs Principais

## Coleção

Total de cartas

Valor estimado

Jogos

Sets completos

Última atualização

---

## Wishlist

Itens

Disponíveis

Promoções

Quedas de preço

Compartilhadas

---

## Decks

Quantidade

Valor

Cartas faltantes

Deck favorito

---

## Pedidos

Em andamento

Entregues

Cancelados

Última compra

---

## Economia

Quanto economizou

Cupons utilizados

Descontos

Frete economizado

---

# 3. Pedidos

Tabela

Pedido

Status

Valor

Frete

Entrega prevista

Marketplace

---

Filtros

Pendentes

Enviados

Entregues

Problemas

---

# 4. Wishlist

Cards

Quantidade

Disponíveis

Sem estoque

Queda de preço

Promoções

---

Mostrar

```
5 cartas ficaram disponíveis
```

---

Ações

Abrir Wishlist

Comprar tudo

Compartilhar

---

# 5. Coleção

Resumo

Valor estimado

Quantidade

Jogos

Sets completos

Cartas raras

Foils

---

Gráficos

Evolução

Valor

Distribuição

---

# 6. Deck Builder

KPIs

Decks

Valor total

Cartas faltantes

Decks favoritos

---

Mostrar

```
Seu Commander está 92% completo
```

---

Ações

Comprar cartas faltantes

Ver ofertas

---

# 7. Recomendações

Baseadas em

Wishlist

Coleção

Decks

Compras

Buscas

---

Cards

```
Talvez você goste
```

```
Baseado na sua coleção
```

```
Jogadores também compraram
```

---

# 8. Marketplace

KPIs

Novas lojas

Novas ofertas

Novas cartas

Quedas de preço

Produtos populares

---

# 9. Price Tracking

Cards

Maior queda

Maior alta

Preço médio

Histórico

---

Alertas

```
Black Lotus

-12%

```

---

```
Charizard

+18%

```

---

# 10. Search Analytics

KPIs

Buscas

CTR

Tempo médio

Categorias

Jogos

---

Mostrar

Últimas buscas

Mais pesquisadas

Sugestões

---

# 11. Histórico

Timeline

Compras

Wishlist

Coleção

Decks

Pedidos

Marketplace

---

# 12. Marketplace Activity

Mostrar

Novos vendedores

Lojas favoritas

Promoções

Eventos

Produtos novos

---

# 13. Gamificação (Beta Futuro)

Preparado para

Conquistas

Níveis

Badges

Sequências

Ranking

---

# 14. Recomendações Inteligentes

Motor IA

Exemplos

```
Seu deck Commander

ficaria completo

com apenas 3 cartas
```

---

```
Sua wishlist

ficou R$ 220 mais barata
```

---

```
Nova loja

possui 18 itens

que você procura
```

---

# 15. Product Analytics

Integração

Buyer Analytics

Marketplace Analytics

Wishlist Analytics

Search Analytics

Purchase Analytics

---

# 16. Performance

KPIs

Tempo carregamento

Última sincronização

Coleção

Wishlist

Pedidos

---

# 17. Alertas

Exemplos

🟢 Pedido enviado

🟡 Carta disponível

🟡 Queda de preço

🔴 Pedido atrasado

🟢 Wishlist atendida

---

# 18. Dashboards Relacionados

Collection Dashboard

Wishlist Dashboard

Order Dashboard

Marketplace Dashboard

Analytics Dashboard

---

# Filtros

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

Outros

---

Categorias

Coleção

Wishlist

Decks

Pedidos

Marketplace

---

# Exportação

CSV

PDF

Compartilhar coleção

Compartilhar wishlist

Exportar decks

---

# Permissões

Buyer

Tudo

---

Admin Marketplace

Somente leitura

---

Suporte

Somente leitura

---

# Atualização

Pedidos

Tempo quase real

---

Wishlist

Tempo quase real

---

Coleção

5 minutos

---

Analytics

5 minutos

---

Marketplace

Tempo quase real

---

# Governança

Todo KPI deve possuir

- owner
- definição oficial
- documentação
- origem
- testes
- versão

---

# Roadmap

## Beta 2

- Dashboard principal
- Pedidos
- Wishlist
- Coleção
- Deck Builder
- Marketplace

---

## Beta 3

- IA personalizada
- Price Prediction
- Recomendações inteligentes
- Alertas preditivos
- Compra automática por preço
- Evolução da coleção
- Social Collections
- Seguimento de vendedores favoritos

---

# Integração com Analytics Runtime

O Buyer Dashboard consome diretamente:

- PRODUCT_METRICS.md
- NORTH_STAR.md
- PRODUCT_HEALTH_RUNTIME.md
- FUNNEL_RUNTIME.md
- COHORT_RUNTIME.md
- EXECUTIVE_DASHBOARD.md

Nenhuma métrica deve ser recalculada no frontend.

---

# Relação com a North Star

O Buyer Dashboard influencia diretamente:

- Pedidos concluídos
- Conversão
- Retenção D7/D30
- Valor médio por pedido
- Engajamento
- Wishlist convertidas
- Compras recorrentes

Essas métricas alimentam o cálculo oficial da **North Star Metric** e do **Product Health Score**.

---

# Resumo

O **Buyer Dashboard** é o centro da experiência do comprador no Judge TCG Marketplace. Ele reúne coleção, wishlist, decks, pedidos, histórico, recomendações e analytics em uma interface única, permitindo que cada usuário acompanhe sua evolução como colecionador e comprador. Integrado ao Product Analytics Runtime, o painel oferece uma experiência personalizada, orientada por dados e preparada para recursos avançados de IA nas próximas fases do produto.