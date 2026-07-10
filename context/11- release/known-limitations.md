 # context/11-release/known-limitations.md

# Known Limitations

**Version:** 1.0  
**Status:** Active  
**Owner:** Platform Engineering / Product  
**Context:** Release Documentation

---

# Objetivo

Este documento registra as limitações conhecidas da plataforma JudgeTCG no momento do lançamento do **General Availability (GA)**.

O objetivo não é listar bugs, mas documentar decisões arquiteturais, restrições técnicas, funcionalidades parcialmente implementadas e melhorias planejadas, garantindo transparência para a equipe de engenharia, produto e stakeholders.

Este documento deve ser atualizado a cada release.

---

# Filosofia

Nem toda limitação representa um problema.

Em muitos casos trata-se de uma decisão deliberada para:

- reduzir complexidade
- priorizar entrega de valor
- preservar arquitetura
- evitar acoplamentos prematuros
- permitir evolução incremental

---

# Classificação

As limitações são classificadas em quatro categorias.

| Tipo | Significado |
|----------|------------|
| Arquitetural | Limitação decorrente da arquitetura atual |
| Técnica | Restrição de implementação |
| Produto | Funcionalidade ainda não entregue |
| Escalabilidade | Melhorias planejadas para crescimento |

---

# 1. Catalog Context

## Product Intelligence Context ainda não separado

Status:

Planned

Descrição:

Atualmente o módulo de Intelligence pertence ao Catalog Context.

No roadmap existe a criação de um bounded context dedicado:

```
Product Intelligence Context
```

Benefícios futuros:

- recomendações avançadas
- machine learning
- embeddings
- sinergias
- análise de meta

Impacto atual:

Baixo.

---

## Imagens de cartas

As imagens dependem da disponibilidade dos provedores externos.

Caso uma imagem esteja indisponível:

- placeholder
- retry
- cache

Ainda não existe mirror oficial das imagens.

Planejado:

Storage próprio + CDN.

---

## Atualização de preços

Preços são sincronizados periodicamente.

Não existe atualização em tempo real.

Trade-off:

Maior estabilidade e menor custo.

---

# 2. Marketplace

## Reserva de estoque

O Marketplace deliberadamente NÃO implementa Reservation Aggregate.

Motivos:

- baixa necessidade em TCG
- complexidade elevada
- risco de deadlocks
- alto custo operacional

Em vez disso:

- validação no checkout
- confirmação durante pagamento
- compensação em caso de conflito

Decisão documentada em:

Marketplace Architecture.

---

## Compra simultânea

Existe pequena possibilidade de duas compras ocorrerem quase simultaneamente.

Mitigação:

- transações
- optimistic locking
- compensação

---

## Produtos Selados

Bundles e produtos selados possuem suporte inicial.

Ainda não existem:

- composição dinâmica
- bundles inteligentes
- regras avançadas

Planejado para:

Product Intelligence Context.

---

# 3. Seller Platform

## Workspace

As preferências do Workspace permanecem em:

```
localStorage
```

Planejado:

Persistência no backend.

---

## Bulk Operations

Bulk Actions reutilizam APIs existentes.

Ainda não existe:

```
POST /bulk/v1
```

Quando o volume crescer será criada API dedicada.

---

## Dashboard

Widgets podem ser personalizados.

Ainda não existe:

- compartilhamento
- templates
- presets por loja

---

# 4. Buyer Platform

## Wishlist

Atualmente:

- listas locais
- funcionalidades principais

Planejado:

- múltiplas listas
- compartilhamento
- colaboração

---

## Deck Shopping

Ainda não possui:

- comparação entre lojas
- otimização completa de frete
- sugestões de substituição automáticas

---

## Smart Cart

Hoje otimiza:

- preço
- quantidade
- disponibilidade

Ainda não otimiza:

- múltiplos centros logísticos
- frete consolidado
- entregas combinadas

---

# 5. Search Platform

## Histórico

Histórico permanece local.

```
localStorage
```

Planejado:

Backend sincronizado.

---

## Favoritos

Favoritos ainda não sincronizam entre dispositivos.

---

## Busca Semântica

A busca atual utiliza:

- fuzzy
- prefix
- ranking

Ainda não utiliza:

- embeddings
- vetores
- semantic search

Planejado para Product Intelligence.

---

# 6. Seller AI

## Nunca executa ações

O Seller AI apenas:

- recomenda
- explica
- prioriza

Nunca:

- publica anúncios
- altera preços
- envia mensagens
- executa ações financeiras

Toda ação exige confirmação humana.

---

## Memória

Ainda não existe memória persistente entre sessões.

Planejado:

Memory Context.

---

## Contexto

Os Context Providers utilizam apenas Application Services existentes.

Não acessam banco diretamente.

---

## Custos

A plataforma utiliza fallback entre provedores.

Em caso de indisponibilidade:

- Mock Provider
- degradação controlada

---

# 7. Judge Platform

## Permissões

O acesso exige:

- Juiz certificado

ou

- Plano PRO

ou

- Plano LGS

Ainda não existe:

certificação por loja.

Planejado:

```
Judge Approval by Store
```

---

# 8. Analytics

## Atualização

Grande parte das projeções é baseada em eventos.

Algumas projeções utilizam rebuild periódico.

Trade-off:

menor carga operacional.

---

## Churn

Modelo atual é heurístico.

Planejado:

Machine Learning.

---

## Pricing Intelligence

Hoje utiliza:

- mediana
- histórico
- ofertas

Ainda não utiliza:

- elasticidade
- sazonalidade
- meta competitivo

---

# 9. Mobile

A plataforma é totalmente responsiva.

Ainda não existem:

- aplicativos nativos
- notificações push
- modo offline

---

# 10. Performance

## Virtualização

Algumas tabelas grandes ainda não utilizam virtualização.

Roadmap:

Sprint 15.

---

## Streaming

Ainda não há uso extensivo de React Server Components Streaming.

---

## Cache

Cache distribuído ainda pode ser expandido.

---

# 11. Observabilidade

A plataforma monitora:

- logs
- métricas
- traces

Ainda não existe:

- AI Root Cause Analysis
- Auto Healing
- Incident Prediction

---

# 12. Internacionalização

Hoje o foco é:

```
pt-BR
```

Planejado:

- inglês
- espanhol
- multi-moeda
- multi-fuso
- impostos regionais

---

# 13. APIs Públicas

Ainda não existe API pública.

Planejado:

REST + Webhooks + OAuth.

---

# 14. Integrações

Integrações futuras:

- Melhor Envio
- Stripe Connect completo
- CardTrader
- CardMarket
- TCGPlayer (quando justificável)
- tcgapi.dev
- LigaMagic
- Pokémon Event Locator

---

# 15. Product Intelligence

Ainda não existe bounded context dedicado.

No roadmap:

```
Product Intelligence Context
```

Responsável por:

- recomendações
- sinergias
- decks
- meta
- ML
- embeddings
- IA especializada

---

# Limitações Deliberadas

As seguintes decisões são intencionais.

## IA nunca executa ações

Por segurança.

---

## Sem SQL na IA

Mantém isolamento arquitetural.

---

## Sem regras no Frontend

Toda regra permanece no Backend.

---

## Catálogo separado do Marketplace

Evita acoplamento.

---

## Sem Reservation Aggregate

Decisão arquitetural.

---

## Feature Flags obrigatórias

Recursos experimentais permanecem isolados.

---

# Limitações Aceitas

| Área | Aceita até |
|------------|------------|
| Workspace localStorage | Sprint 16 |
| Histórico local | Sprint 16 |
| Busca sem embeddings | Product Intelligence |
| Churn heurístico | IA V2 |
| Virtualização parcial | Sprint 15 |
| Produtos selados simples | Product Intelligence |
| Wishlist local | Sprint 16 |

---

# Não são limitações

Os itens abaixo são decisões de arquitetura.

- Event Driven
- CQRS
- Outbox Pattern
- Feature Flags
- Read Models
- Bounded Contexts
- Seller AI determinístico
- Confirmação humana obrigatória

---

# ADRs

## ADR-001

Não sacrificar arquitetura por funcionalidades rápidas.

---

## ADR-002

Toda limitação deve possuir roadmap.

---

## ADR-003

Não criar acoplamentos temporários.

---

## ADR-004

IA permanece assistiva.

---

## ADR-005

Escalabilidade é priorizada sobre otimizações prematuras.

---

# Roadmap para Eliminação das Limitações

## Curto Prazo

- Virtualização
- Backend para Workspace
- Wishlist persistente
- Filtros sincronizados

---

## Médio Prazo

- Product Intelligence Context
- Busca vetorial
- Memória persistente
- Mobile Apps
- Melhor Envio

---

## Longo Prazo

- Marketplace internacional
- Multi-moeda
- AI multimodal
- APIs públicas
- Self-Healing Infrastructure
- Auto Scaling Inteligente

---

# Revisão

Este documento deve ser revisado:

- a cada Sprint
- antes de cada Release Candidate
- antes do General Availability
- após grandes mudanças arquiteturais

---

# Conclusão

As limitações documentadas neste arquivo representam escolhas conscientes de engenharia e produto, priorizando consistência arquitetural, segurança operacional e evolução sustentável da plataforma.

O JudgeTCG foi projetado para crescer de forma incremental. As funcionalidades ausentes possuem roadmap definido, sem comprometer a estabilidade do sistema ou gerar dívida técnica significativa. Dessa forma, o produto mantém uma base sólida para futuras expansões, como o **Product Intelligence Context**, IA avançada, internacionalização e APIs públicas.