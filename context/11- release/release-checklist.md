# context/11-release/release-checklist.md

# Release Checklist

**Version:** 1.0  
**Status:** Active  
**Owner:** Platform Engineering  
**Context:** Release Management

---

# Objetivo

Este documento define o checklist oficial de Release do JudgeTCG.

Seu objetivo é garantir que qualquer deploy em ambientes de Homologação, Staging ou Produção ocorra de forma previsível, segura, auditável e com risco controlado.

Nenhuma versão deve ser promovida para produção sem a aprovação deste checklist.

---

# Filosofia

Toda release deve ser:

- Pequena
- Reversível
- Observável
- Automatizada
- Auditável
- Reproduzível

Deploy não é o objetivo.

Deploy seguro é o objetivo.

---

# Estratégia de Release

Fluxo oficial:

```text
Development
      │
      ▼
Continuous Integration
      │
      ▼
Staging
      │
      ▼
Release Candidate
      │
      ▼
Production
      │
      ▼
Monitoring
      │
      ▼
Release Complete
```

---

# Tipos de Release

| Tipo | Descrição |
|--------|-----------|
| Patch | Correções pequenas |
| Minor | Novas funcionalidades compatíveis |
| Major | Mudanças arquiteturais |
| Emergency | Hotfix crítico |
| Rollback | Retorno para versão anterior |

---

# Pré-Requisitos

Antes de iniciar qualquer deploy:

- Código revisado
- Pull Request aprovado
- Build verde
- Testes aprovados
- Migrations revisadas
- Changelog atualizado
- Feature Flags configuradas
- Ambiente validado

---

# Checklist Geral

## Código

- [ ] PR aprovado
- [ ] Sem conflitos
- [ ] Branch atualizada
- [ ] Convenções respeitadas
- [ ] Sem TODOs críticos
- [ ] Sem código comentado
- [ ] Sem credenciais

---

## Build

- [ ] Build Production executado
- [ ] Build sem erros
- [ ] Assets gerados
- [ ] Sourcemaps publicados
- [ ] Bundle analisado

---

## Testes

### Unitários

- [ ] Backend
- [ ] Frontend
- [ ] AI
- [ ] Domain

---

### Integração

- [ ] APIs
- [ ] Banco
- [ ] Queue
- [ ] Storage

---

### End-to-End

- [ ] Marketplace
- [ ] Seller
- [ ] Buyer
- [ ] Judge
- [ ] Checkout
- [ ] Login

---

### Performance

- [ ] Tempo de resposta
- [ ] Carga
- [ ] Stress
- [ ] Smoke Tests

---

# Banco de Dados

Antes da migration:

- [ ] Backup realizado
- [ ] Migration revisada
- [ ] Índices validados
- [ ] Locks analisados
- [ ] Rollback disponível

Após migration:

- [ ] Tabelas criadas
- [ ] Views válidas
- [ ] Constraints válidas
- [ ] Dados íntegros

---

# APIs

Validar:

- [ ] OpenAPI atualizado
- [ ] Versionamento
- [ ] Breaking Changes documentadas
- [ ] Rate Limits
- [ ] Autenticação
- [ ] Autorização

---

# Segurança

Checklist obrigatório.

- [ ] Secrets atualizados
- [ ] ENV validada
- [ ] Tokens válidos
- [ ] Certificados
- [ ] HTTPS
- [ ] CSP
- [ ] CORS
- [ ] Headers

---

# Feature Flags

Todas as novas funcionalidades devem possuir estratégia de ativação.

| Feature | Flag | Default |
|----------|------|----------|
| Seller AI | seller_ai | Off |
| Buyer AI | buyer_ai | Off |
| Global Search | global_search | On |
| Catalog Intelligence | catalog_ai | On |

Checklist:

- [ ] Flags cadastradas
- [ ] Default definido
- [ ] Plano validado
- [ ] Rollout configurado

---

# IA

Para funcionalidades de IA:

- [ ] Prompt versionado
- [ ] Context Providers revisados
- [ ] Recommendation Engine validado
- [ ] Guardrails aprovados
- [ ] Evaluation executada
- [ ] Cost Control aprovado

---

# Catálogo

Validar:

- [ ] Cartas sincronizadas
- [ ] Imagens disponíveis
- [ ] Expansões consistentes
- [ ] Preços atualizados
- [ ] Busca funcionando

---

# Marketplace

Checklist:

- [ ] Publicação
- [ ] Listagens
- [ ] Estoque
- [ ] Carrinho
- [ ] Checkout
- [ ] Pedidos
- [ ] Frete
- [ ] Pagamentos

---

# Seller Experience

Validar:

- [ ] Dashboard
- [ ] Command Center
- [ ] Wizard
- [ ] Bulk Actions
- [ ] Inbox
- [ ] Search
- [ ] Seller AI

---

# Buyer Experience

Validar:

- [ ] Dashboard
- [ ] Wishlist
- [ ] Smart Cart
- [ ] Deck Shopping
- [ ] Reputação
- [ ] Busca
- [ ] Checkout

---

# Judge

Checklist:

- [ ] Consulta de regras
- [ ] Oracle
- [ ] Rulings
- [ ] Pesquisa
- [ ] ACL
- [ ] Permissões

---

# Observabilidade

Antes do deploy:

- [ ] Dashboards atualizados
- [ ] Alertas configurados
- [ ] Logs centralizados
- [ ] Métricas publicadas
- [ ] Tracing ativo

Após deploy:

- [ ] Health Check
- [ ] Error Rate
- [ ] Latência
- [ ] CPU
- [ ] Memória

---

# Jobs

Validar:

- [ ] Scheduler
- [ ] Queue
- [ ] Retry
- [ ] Dead Letter Queue
- [ ] Workers

---

# Cache

Checklist:

- [ ] Redis
- [ ] Invalidação
- [ ] TTL
- [ ] Warmup

---

# CDN

- [ ] Imagens
- [ ] CSS
- [ ] JS
- [ ] Cache Headers

---

# Analytics

Confirmar:

- [ ] Eventos publicados
- [ ] Dashboards atualizados
- [ ] Funnels
- [ ] KPIs

---

# SEO

Marketplace:

- [ ] Sitemap
- [ ] Robots
- [ ] Canonical URLs
- [ ] OpenGraph
- [ ] JSON-LD

---

# Mobile

Validar:

- [ ] Responsividade
- [ ] Touch
- [ ] Sticky Actions
- [ ] Performance

---

# Acessibilidade

Checklist:

- [ ] Navegação por teclado
- [ ] Contraste
- [ ] Labels
- [ ] Focus
- [ ] Screen Readers

---

# Smoke Test Pós-Deploy

Executar imediatamente.

## Usuário

- [ ] Login
- [ ] Logout
- [ ] Cadastro

---

## Marketplace

- [ ] Buscar carta
- [ ] Abrir detalhe
- [ ] Comprar
- [ ] Carrinho

---

## Seller

- [ ] Dashboard
- [ ] Publicar anúncio
- [ ] Alterar preço
- [ ] Operação

---

## Judge

- [ ] Buscar regra
- [ ] Abrir documento

---

# Critérios de Aprovação

A release somente poderá ser concluída quando:

- [ ] Build verde
- [ ] Smoke tests aprovados
- [ ] Sem erro crítico
- [ ] Error Rate normal
- [ ] Observabilidade estável
- [ ] Equipe aprova

---

# Critérios para Rollback

Executar rollback imediatamente caso ocorra:

- indisponibilidade do marketplace
- falha de autenticação
- erro em pagamentos
- corrupção de dados
- migrations falhando
- aumento severo de erros 5xx
- degradação crítica de performance

---

# Responsabilidades

| Papel | Responsabilidade |
|---------|------------------|
| Tech Lead | Aprovação técnica |
| Backend | APIs e Banco |
| Frontend | Interface |
| Platform | Deploy |
| QA | Validação |
| Produto | Aprovação funcional |

---

# Registro da Release

Cada release deve registrar:

```text
Release Version

Data

Responsável

Branch

Commit

Tag

Migration

Feature Flags

Tempo de Deploy

Tempo de Indisponibilidade

Rollback Necessário?

Observações
```

---

# Definition of Done (Release)

Uma release é considerada concluída apenas quando:

- Deploy realizado
- Smoke Tests aprovados
- Dashboards monitorando normalmente
- Alertas sem incidentes
- Usuários operando normalmente
- Release registrada
- Equipe aprova encerramento

---

# ADRs

## ADR-001

Toda release deve possuir checklist obrigatório.

---

## ADR-002

Build verde é requisito mínimo para deploy.

---

## ADR-003

Smoke Tests são obrigatórios após produção.

---

## ADR-004

Feature Flags devem proteger novas funcionalidades.

---

## ADR-005

Deploy deve ser reversível.

---

## ADR-006

Toda release gera registro auditável.

---

## ADR-007

Observabilidade é requisito para encerramento da release.

---

## ADR-008

Rollback deve ser possível em qualquer momento do deploy.

---

# Roadmap

## Atual

- Checklist padronizado
- Smoke Tests
- Feature Flags
- Gate de qualidade
- Registro de release

## Futuro

- Deploy automático com aprovação
- Progressive Delivery
- Canary Releases
- Blue/Green Deployment
- Chaos Validation
- Release Health Score
- Automatic Rollback
- AI Release Assistant

---

# Integração com a Arquitetura

```text
GitHub
   │
   ▼
CI Pipeline
   │
   ▼
Build
   │
   ▼
Tests
   │
   ▼
Release Checklist
   │
   ▼
Staging
   │
   ▼
Production
   │
   ▼
Monitoring
   │
   ▼
Release Completed
```

---

# Conclusão

O Release Checklist estabelece um padrão único para todas as entregas do JudgeTCG.

Ao combinar validações técnicas, funcionais, operacionais e de observabilidade, o processo reduz significativamente o risco de regressões e garante que cada nova versão da plataforma seja entregue com qualidade, previsibilidade e segurança, mantendo a consistência entre Marketplace, Catálogo, IA, Seller Experience, Buyer Experience e infraestrutura da plataforma.
---

# Beta 1.5 — Event Integrity Quality Gates

**Status:** Active · **Owner:** Platform

Nenhum evento novo de product analytics pode ir a produção sem:

| Gate | Evidência |
|------|-----------|
| Registry entry | `app/judge/event_registry.py` + `docs/product/EVENT_REGISTRY.md` |
| Schema version | `event_schema_version` em EVENT_VERSIONING |
| Owner | Campo `owner` no registry |
| Documentation | Taxonomy / Catalog / Parity atualizados |
| Test | `tests/judge/test_event_integrity.py` (FE⊆BE) |
| Payload contract | Props required/optional listadas |
| Compatibility | Default v1; sem rename breaking sem dual-write |
| Telemetry | Ingest retorna persisted/DLQ; sem drop silencioso |

**Release blocker:** spike de `lost` / tempestade DLQ `unknown_event` após deploy.

Ver: `docs/product/EVENT_TESTING.md`, `docs/product/ANALYTICS_HEALTH.md`.
