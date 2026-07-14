 # Seller Dashboard
**Versão:** 1.0  
**Status:** Public Beta  
**Base:** RC1 + Sprint 17 Inventory Platform + Beta 2 Product Analytics Runtime

---

# Objetivo

O **Seller Dashboard** é o painel principal do lojista dentro do Judge TCG Marketplace.

Seu objetivo é permitir que o vendedor acompanhe, em tempo real, a saúde da sua operação, vendas, estoque, reputação e oportunidades de crescimento.

O painel deve responder diariamente:

- Como minhas vendas estão?
- Meu estoque está saudável?
- Estou perdendo vendas?
- Quais produtos devo repor?
- Quais anúncios precisam de atenção?
- Como melhorar meu faturamento?

---

# Princípios

O Seller Dashboard deve ser:

- rápido (<500ms para KPIs);
- orientado por métricas;
- baseado em Product Analytics Runtime;
- atualizado continuamente;
- responsivo;
- preparado para IA futura.

---

# Arquitetura

```
Inventory

+

Orders

+

Analytics Runtime

+

Marketplace

↓

Seller Dashboard

↓

KPIs

↓

Insights

↓

Ações
```

---

# Layout Geral

```
──────────────────────────────────────────────

Boas-vindas

Resumo Diário

──────────────────────────────────────────────

KPIs

Pedidos

Receita

Estoque

Reputação

──────────────────────────────────────────────

Pedidos Recentes

Produtos Populares

Baixo Estoque

──────────────────────────────────────────────

Analytics

Conversão

Busca

Funil

Marketplace

──────────────────────────────────────────────

Insights

Alertas

Recomendações IA

```

---

# 1. Resumo Diário

Exibir

```
Bom dia, Guilherme

Hoje você vendeu:

R$ 1.285

(+18%)

```

Também mostrar

Pedidos

Itens vendidos

Novos seguidores

Produtos visualizados

---

# 2. KPIs Principais

## Receita

Hoje

7 dias

30 dias

90 dias

---

## Pedidos

Quantidade

Pendentes

Em separação

Enviados

Finalizados

Cancelados

---

## Ticket Médio

```
GMV

/

Pedidos
```

---

## Conversão

```
Pedidos

/

Visualizações
```

---

## Produtos Ativos

Total

Disponíveis

Sem estoque

Ocultos

---

## Estoque

Itens

Valor estimado

Produtos críticos

Cobertura

---

## Reputação

Nota

Avaliações

Tempo resposta

Entregas

Cancelamentos

---

# 3. Receita

Cards

GMV

Receita líquida

Comissões

Frete

Escrow

Reembolsos

---

Gráficos

Diário

Semanal

Mensal

Anual

---

# 4. Pedidos

Lista recente

Pedido

Cliente

Status

Valor

Pagamento

Envio

Prazo

---

Filtros

Hoje

Pendentes

Problemas

Cancelados

---

# 5. Inventory Health

Origem

Sprint 17

KPIs

Produtos ativos

Produtos sem estoque

Produtos críticos

Produtos expirados

Preço desatualizado

Atualização média

---

Indicadores

Health Score

```
95+

Excelente
```

```
80+

Bom
```

```
60+

Atenção
```

```
<60

Crítico
```

---

# 6. Produtos Mais Vendidos

Tabela

Produto

Quantidade

Receita

Visualizações

Conversão

Lucro

---

# 7. Produtos com Baixo Estoque

Tabela

Produto

Quantidade restante

Dias estimados

Reposição sugerida

---

Alerta

```
Reposição recomendada
```

---

# 8. Produtos Sem Venda

Produtos

Última venda

Visualizações

Favoritos

Dias sem venda

---

Ações

Editar anúncio

Revisar preço

Promover

---

# 9. Search Analytics

KPIs

Visualizações

CTR

Posição média

Zero Results

Busca relacionada

---

Mostrar

Top buscas

Top cartas

Top categorias

---

# 10. Conversão

Funil

```
Impressões

↓

Visualizações

↓

Oferta aberta

↓

Carrinho

↓

Checkout

↓

Compra
```

Mostrar

Conversão

Abandono

Tempo médio

---

# 11. Marketplace

Comparação

Sua loja

Marketplace

---

KPIs

Conversão

Preço

Tempo envio

Avaliações

GMV

---

Mostrar

```
Você está

+18%

acima da média
```

---

# 12. Performance dos Anúncios

Tabela

Carta

Views

CTR

Favoritos

Carrinhos

Compras

---

Ordenação

Mais vistos

Maior conversão

Menor conversão

---

# 13. Financeiro

Receita

Saldo disponível

Escrow

Recebimentos

Pagamentos futuros

---

Mostrar

Calendário

---

# 14. Alertas

Exemplos

🔴 Produto sem estoque

🟡 Produto parado

🟡 Preço acima do mercado

🔴 Pedido atrasado

🟢 Meta diária atingida

---

# 15. Recomendações

Motor baseado em Analytics

Exemplos

```
Reponha Black Lotus

Últimos 7 dias

+380% procura
```

---

```
Reduza preço

Lightning Bolt

CTR alta

Conversão baixa
```

---

```
Adicionar foil

Maior conversão

+14%
```

---

# 16. Product Analytics

Integração

Buyer Analytics

Marketplace Analytics

Inventory Analytics

Revenue Analytics

---

# 17. IA (Beta 3)

Preparado para

Resumo diário

Explicações

Forecast

Sugestões

ABC

Preço sugerido

Reposição

---

# 18. Dashboard de Inventário

Origem

Sprint 17

Cards

Inventory Health

Importações

Exportações

Produtos

Atualizações

Disponibilidade

---

# 19. Dashboards Relacionados

Inventory Dashboard

Revenue Dashboard

Order Dashboard

Analytics Dashboard

Marketplace Dashboard

---

# Filtros

Período

Hoje

7 dias

30 dias

90 dias

Ano

---

Categorias

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

Filtros

Idioma

Condição

Foil

Coleção

Preço

---

# Exportação

CSV

Excel

PDF

Compartilhar

---

# Permissões

Seller

Tudo

---

Admin Marketplace

Visualização completa

---

Suporte

Somente leitura

---

# Atualização

Pedidos

Tempo quase real

---

Analytics

5 minutos

---

Receita

5 minutos

---

Inventory

Tempo quase real

---

# Governança

Todo KPI deve possuir

- owner
- definição oficial
- documentação
- testes
- origem
- versão

---

# Roadmap

## Beta 2

- Dashboard principal
- Inventory Analytics
- Revenue
- Pedidos
- Analytics
- Marketplace

---

## Beta 3

- IA para vendedores
- Forecast de vendas
- Sugestão de preços
- Curva ABC
- Predição de ruptura
- Reposição automática
- Recomendações inteligentes

---

# Integração com Analytics Runtime

O Seller Dashboard consome diretamente:

- PRODUCT_METRICS.md
- NORTH_STAR.md
- PRODUCT_HEALTH_RUNTIME.md
- FUNNEL_RUNTIME.md
- COHORT_RUNTIME.md
- EXECUTIVE_DASHBOARD.md

Nenhuma métrica deve ser recalculada no frontend.

---

# Resumo

O **Seller Dashboard** é o centro operacional do lojista no Judge TCG Marketplace. Ele consolida indicadores de vendas, estoque, pedidos, reputação, busca e receita em uma única interface, transformando dados do Product Analytics Runtime em ações práticas para aumentar conversão, reduzir perdas de estoque e acelerar o crescimento das lojas durante o Public Beta e nas versões futuras.