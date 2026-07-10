# context/10-ai/memory.md

# AI Memory Architecture

**Version:** 1.0  
**Status:** Active  
**Owner:** AI Platform Team  
**Context:** Artificial Intelligence Platform

---

# Objetivo

Este documento define a arquitetura oficial de **Memory** do JudgeTCG.

Memory representa a capacidade dos Copilots de reutilizar contexto previamente conhecido sem transformar o sistema em um chatbot com memória ilimitada.

A memória é um componente arquitetural.

Ela não pertence ao Provider.

Ela não pertence ao Prompt.

Ela pertence à plataforma.

---

# Filosofia

Memória não significa guardar conversas.

Memória significa guardar conhecimento útil.

Exemplos:

- idioma preferido
- loja favorita
- formato favorito
- últimos filtros utilizados
- contexto operacional recente
- preferências do usuário

Nunca:

- guardar prompts completos
- guardar respostas do LLM
- guardar informações sensíveis sem necessidade

---

# Objetivos

O sistema de Memory deve:

- reduzir tokens
- reduzir custo
- melhorar continuidade
- personalizar respostas
- preservar contexto
- respeitar privacidade
- funcionar entre Providers

---

# Arquitetura

```mermaid
flowchart TD

User

↓

Copilot

↓

Memory Manager

↓

Memory Providers

↓

Short Memory

Long Memory

Semantic Memory

↓

Context Builder

↓

Prompt Builder
```

---

# Tipos de Memória

O JudgeTCG possui quatro tipos oficiais.

```
Working Memory

↓

Short-Term Memory

↓

Long-Term Memory

↓

Semantic Memory
```

Cada uma possui responsabilidades distintas.

---

# Working Memory

Existe apenas durante uma execução.

Exemplo

```
Pergunta atual

↓

Contexto carregado

↓

Recommendations

↓

Tool Results
```

É descartada ao final da resposta.

---

# Short-Term Memory

Mantém contexto da sessão.

Exemplos

```
Última carta pesquisada

↓

Última loja aberta

↓

Último pedido consultado

↓

Último deck
```

TTL:

```
30 minutos

↓

24 horas
```

Configurável.

---

# Long-Term Memory

Mantém preferências persistentes.

Exemplos

```
Idioma

Tema

Formato favorito

Jogos favoritos

Coleções favoritas

Preferências do Marketplace

Preferências do Seller
```

Não guarda conversas completas.

---

# Semantic Memory

Armazena conhecimento indexado.

Baseado em embeddings.

Exemplo

```
"Usuário costuma vender Pokémon"

↓

Embedding

↓

Busca vetorial
```

Não depende do Provider.

---

# Arquitetura Geral

```mermaid
flowchart LR

Copilot

↓

Memory Manager

↓

Memory Providers

↓

Storage

↓

Redis

PostgreSQL

Vector Store
```

---

# Memory Manager

O Memory Manager coordena:

- leitura
- escrita
- expiração
- compressão
- deduplicação
- versionamento

Nunca contém regras de negócio.

---

# Memory Providers

Cada tipo de memória possui um Provider.

```
Working Memory Provider

Short Memory Provider

Long Memory Provider

Semantic Memory Provider
```

Todos implementam o mesmo contrato.

---

# Interface Oficial

```typescript
interface MemoryProvider {

load(context)

store(memory)

forget(id)

search(query)

expire()

}
```

---

# Memory Entry

Toda memória possui estrutura única.

```typescript
MemoryEntry {

id

tenant

user

scope

category

summary

payload

embedding

createdAt

updatedAt

expiresAt

version

}
```

---

# Scopes

A memória pode existir em diferentes níveis.

```
Global

Tenant

Store

User

Conversation

Copilot
```

Exemplos:

```
Store

↓

Preferências da loja

----------------

User

↓

Idioma

----------------

Conversation

↓

Última busca
```

---

# Categorias

Categorias oficiais.

```
Preferences

History

Search

Collections

Wishlist

Decks

Seller

Buyer

Judge

Catalog

Analytics

Conversation
```

---

# Persistência

Working Memory

```
RAM
```

Short Memory

```
Redis
```

Long Memory

```
PostgreSQL
```

Semantic Memory

```
pgvector

ou

Qdrant
```

---

# Context Injection

Antes do Prompt.

Fluxo

```
User

↓

Memory

↓

Context Providers

↓

Prompt Builder
```

A memória é apenas mais um Context Provider.

---

# Memory Ranking

Caso existam centenas de memórias.

Critérios:

```
Relevância

↓

Recência

↓

Frequência

↓

Categoria

↓

Prioridade
```

---

# Memory Compression

Memórias antigas podem ser resumidas.

Exemplo

```
100 conversas

↓

Resumo

↓

Memória única
```

Nunca enviar histórico completo ao modelo.

---

# Forgetting Policy

Toda memória possui política de expiração.

Exemplo

```
Search

7 dias

----------------

Conversation

24 horas

----------------

Preferences

Nunca expira

----------------

Recommendations

30 dias
```

---

# User Preferences

Exemplos

```
Idioma

Moeda

Tema

Jogos

Layout

Filtros

Marketplace favorito

Modo escuro
```

---

# Seller Memory

Exemplos

```
Loja principal

Categorias favoritas

Preço preferido

Configuração de estoque

Modo ERP

Painel favorito
```

---

# Buyer Memory

Exemplos

```
Wishlist

Decks

Coleção

Lojas favoritas

Últimas compras

Expansões favoritas
```

---

# Judge Memory

Exemplos

```
Formato favorito

TCGs utilizados

Últimos documentos

Últimas regras

Consultas recentes
```

---

# Semantic Search

Fluxo

```mermaid
flowchart TD

Pergunta

↓

Embedding

↓

Vector Search

↓

Relevant Memories

↓

Prompt
```

---

# Deduplicação

Antes de salvar.

```
Nova memória

↓

Existe equivalente?

↓

Sim

↓

Atualizar

↓

Não

↓

Inserir
```

---

# Observabilidade

Registrar:

```
memory_type

hits

misses

ttl

size

latência

compressão

embeddings

tenant

user

copilot

request_id
```

---

# Segurança

Nunca armazenar:

- senhas
- tokens
- cartões
- PIX
- CPF sem necessidade
- documentos oficiais
- credenciais
- segredos

Toda memória respeita:

- LGPD
- Tenant Isolation
- RBAC
- ABAC

---

# Criptografia

Long-Term Memory pode utilizar:

```
AES-256

↓

Encrypted Columns

↓

KMS
```

Dados sensíveis devem permanecer criptografados.

---

# Consentimento

O usuário pode:

- visualizar memórias
- apagar memórias
- exportar memórias
- redefinir preferências

Conforme LGPD.

---

# Multi-Tenant

Nunca compartilhar memória.

```
Tenant A

↓

Nunca acessa

↓

Tenant B
```

---

# Performance

Metas:

```
Working Memory

<1 ms

----------------

Redis

<10 ms

----------------

Vector Search

<50 ms

----------------

Postgres

<30 ms
```

---

# Testabilidade

Cada Provider possui:

- testes unitários
- testes de carga
- mocks
- validação de TTL
- testes de deduplicação

---

# Anti-patterns

Nunca:

❌ Guardar prompt completo

❌ Guardar resposta completa do LLM

❌ Salvar contexto desnecessário

❌ Misturar tenants

❌ Salvar SQL

❌ Memória infinita

❌ Dependência do Provider

❌ Armazenar segredos

---

# ADRs

## ADR-001

Memory pertence à plataforma.

---

## ADR-002

Working Memory nunca é persistida.

---

## ADR-003

Semantic Memory utiliza embeddings independentes do Provider.

---

## ADR-004

Toda memória possui TTL.

---

## ADR-005

Memory Manager coordena todos os Providers.

---

## ADR-006

Preferências pertencem à Long-Term Memory.

---

## ADR-007

Toda memória respeita isolamento por Tenant.

---

## ADR-008

Context Providers podem consumir Memory, mas nunca alterá-la diretamente.

---

# Roadmap

## Atual

- Working Memory
- Short-Term Memory
- Long-Term Memory
- Semantic Memory
- User Preferences

## Futuro

- Episodic Memory
- Multi-Agent Shared Memory
- Conversation Summarization
- Knowledge Graph Memory
- Memory Replay
- Memory Quality Score
- Adaptive Forgetting
- Personalized Recommendations
- Cross-Device Memory
- Federated Memory

---

# Integração com a Arquitetura

```
Copilot
      │
      ▼
Memory Manager
      │
      ├─────────────┐
      ▼             ▼
Memory Providers  Context Providers
      │             │
      └──────┬──────┘
             ▼
      Prompt Builder
             ▼
        LLM Provider
```

A Memory é uma fonte de contexto complementar aos Context Providers, nunca um substituto.

---

# Conclusão

A arquitetura de Memory do JudgeTCG permite que os Copilots ofereçam experiências contínuas, personalizadas e eficientes sem comprometer privacidade, isolamento entre tenants ou previsibilidade.

Ao separar Working Memory, Short-Term Memory, Long-Term Memory e Semantic Memory, a plataforma reduz custos de tokens, melhora a qualidade das respostas e cria uma base sólida para futuras capacidades como agentes cooperativos, memória episódica e Model Context Protocol (MCP), mantendo total controle sobre os dados dentro da própria arquitetura.