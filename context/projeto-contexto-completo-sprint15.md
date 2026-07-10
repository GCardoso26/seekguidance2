# JudgeTCG — Contexto Completo do Projeto (até Sprint 15)

**Versão:** 1.0  
**Status:** Ativo  
**Última atualização:** 2026-07-08  
**Escopo:** Consolidação arquitetural, funcional e operacional até a Sprint 15

---

## 1) Visão geral

O JudgeTCG é uma plataforma de ecossistema TCG com foco em:

- Marketplace (seller + buyer experience)
- Catálogo de cartas e inteligência de produto
- Judge assistant para regras e consultas
- Módulos de IA com guardrails e governança
- Operação orientada a observabilidade, telemetria e release seguro

O projeto adota abordagem **DDD + CQRS + Read Models + Feature Flags + Outbox** como base para evolução incremental e rollback-safe.

---

## 2) Princípios arquiteturais inegociáveis

1. **LLM nunca contém regra de negócio**  
   Regras vivem em Aggregates, Domain Services e Application Services.

2. **IA nunca altera estado sozinha**  
   Qualquer mutação exige confirmação humana e caminho de comando explícito.

3. **Frontend nunca aplica regra de domínio crítica**  
   UI consome APIs/BFF; sem acesso direto ao banco.

4. **Contextos desacoplados por ACL/contratos**  
   Integração entre domínios via adapters/DTOs, não por acoplamento implícito.

5. **Release é observável e reversível**  
   Deploy só com quality gates, telemetria ativa e plano de rollback.

---

## 3) Stack e organização

### Backend

- FastAPI (services/api)
- PostgreSQL/Supabase
- SQL explícito em serviços de aplicação
- Outbox events para integração assíncrona

### Frontend

- Next.js (App Router)
- BFF routes em `frontend/runtime_console_v3/src/app/api/*`
- React Query, providers de busca, componentes por domínio

### Dados e migrações

- Migrações SQL em `supabase/migrations/`
- Read models para dashboards, analytics e projeções de performance

### Contexto e governança

- Documentação em `context/`
- Handbooks de IA em `context/10-ai/`
- Handbooks de release em `context/11- release/`

---

## 4) Modelo de camadas (referência operacional)

Fluxo padrão:

`Controller/API -> Application Service -> Read Model/Aggregate -> Outbox/Eventos -> Observabilidade`

Com IA:

`Pergunta -> Context Providers -> Prompt Builder -> Recommendation Engine -> Provider -> Resposta estruturada -> Confirmação humana (quando aplicável)`

---

## 5) Módulos funcionais principais

## Marketplace

- Listagens, carrinho, checkout, pedidos, reputação de loja
- Buyer experience (dashboard, recomendações, smart cart, wishlist)
- Seller operations (catálogo, dashboard, ações operacionais)

## Catálogo

- Busca, detalhe da carta, inteligência contextual, taxonomia
- Dados enriquecidos para marketplace via ACL

## IA

- Copilotos por função (seller, buyer, judge, admin)
- Telemetria de custo/tokens/latência
- Guardrails, versionamento de prompts e avaliação

## Plataforma e release

- Feature flags para rollout progressivo
- Checklist de release, performance budgets, observabilidade e incident response

---

## 6) Linha do tempo consolidada (alto nível)

- **Sprints anteriores:** fundação de marketplace/catalog/judge, baseline de seller e buyer experiences, estruturas de IA e observabilidade.
- **Sprint 14:** expansão forte de buyer experience (dashboard, recomendações, smart cart, busca contextual, reputação, integrações de UX).
- **Sprint 15 (foco):** Performance & Polish para rota de Public Beta, incluindo wishlist backend, shipping v2, ACL formal, analytics/cohorts, melhorias de telemetria e virtualização de galeria.

---

## 7) Entregas da Sprint 15 (baseline até última alteração)

## 7.1 Wishlist backend + integração frontend

**Backend:**

- Migração `20260708160000_sprint15_wishlist_shipping_analytics.sql`
  - `wishlist_lists`
  - `wishlist_items`
  - view de compatibilidade `wishlists`
  - RLS para wishlist
- `app/marketplace/wishlist_aggregate.py`
- `app/marketplace/wishlist.py`
- Rotas buyer/legacy em `app/api/v1/buyer_api.py`

**Frontend/BFF:**

- Rotas BFF buyer wishlists em `src/app/api/buyer/wishlists/*`
- Hook `src/hooks/useWishlistLists.ts`
- Atualizações em `src/components/marketplace/WishlistPage.tsx`
- Provider de busca de wishlist atualizado para fluxo backend quando `WISHLIST_V2`

## 7.2 Shipping v2 + Melhor Envio

- `app/integrations/melhor_envio/client.py` com `calculate_shipping`
- `app/marketplace/freight_quote.py`
- `app/marketplace/shipping_service.py`
- Read model de frete na migração Sprint 15
- Rota BFF `src/app/api/buyer/shipping/quote/route.ts`
- Flag operacional backend: `SHIPPING_V2_ENABLED`

## 7.3 ACL Catalog <-> Marketplace

- Novo adapter formal: `app/marketplace/catalog_marketplace_adapter.py`
- `app/catalog/detail_service.py` atualizado para projetar listings via ACL quando disponível

## 7.4 Buyer Analytics + Cohorts (CQRS)

- `app/marketplace/buyer_analytics.py`
- `app/marketplace/buyer_cohorts.py`
- Tabelas/projeções:
  - `buyer_analytics_projection`
  - `buyer_cohort_projection`

## 7.5 Performance e telemetria

- Virtualização de galeria com `@tanstack/react-virtual` em `CardGrid`
- Ampliação de eventos em `src/lib/analytics.ts`
- Novas flags no frontend em `src/lib/feature-flags.ts`:
  - `WISHLIST_V2`
  - `SHIPPING_V2`

## 7.6 Outbox/Eventos de domínio

- Emissão de eventos de wishlist (ex.: criação/compartilhamento) no fluxo de aplicação.

---

## 8) Estado de qualidade conhecido (até Sprint 15)

## Validado

- Pytest de escopo Sprint 15 (wishlist/freight/smart_cart) executado com sucesso
- Vitest frontend executado com sucesso no estado atual de trabalho

## Pontos de atenção registrados

- Build frontend em ambiente local apresentou OOM (memória do Node)
- Type-check frontend possui erros pré-existentes em testes fora do escopo direto da Sprint 15
- Working tree ampla e acumulada de sprint anterior + sprint atual (estado ainda não consolidado em release limpa)

---

## 9) Feature flags e rollout recomendado

- `WISHLIST_V2` (frontend): habilitar progressivamente por segmento
- `SHIPPING_V2` (frontend) + `SHIPPING_V2_ENABLED` (backend): iniciar em staging, validar cotações, então expandir

Estratégia:

1. Staging com smoke tests completos
2. Canary em produção para percentual reduzido
3. Monitorar latência, erro, abandono de checkout e métricas de conversão
4. Expandir gradualmente

---

## 10) Checklist de release aplicável

Base em `context/11- release/release-checklist.md`:

- Build, testes unit/integration/e2e e smoke
- Revisão de migrations + backup/rollback
- Flags configuradas
- Observabilidade/telemetria prontas
- Validação buyer flow: dashboard, wishlist, smart cart, checkout
- Critérios de rollback definidos antes do deploy

---

## 11) Riscos residuais e dívida técnica

1. **Consolidação de branch/worktree:** volume alto de mudanças simultâneas.
2. **Parcial de polish/a11y/image health:** ainda há itens para endurecimento pré-beta.
3. **Performance de build local:** precisa de baseline estável em CI com memória adequada.
4. **Type-check de testes legados:** recomenda-se saneamento para reduzir ruído em gates.

---

## 12) Próximos passos recomendados (pós-Sprint 15)

1. Executar migração Sprint 15 em staging e validar contratos.
2. Fechar pendências de a11y WCAG AA.
3. Finalizar dashboard de saúde de imagens.
4. Reforçar profiling de páginas críticas (marketplace, detalhe, checkout).
5. Normalizar quality gates em pipeline único (build/test/lint/type-check).
6. Publicar release notes e changelog técnico da Public Beta.

---

## 13) Referências de contexto

- `context/10-ai/readme.md`
- `context/11- release/release-checklist.md`
- `context/11- release/performance.md`
- `context/11- release/telemetry.md`
- `supabase/migrations/20260708160000_sprint15_wishlist_shipping_analytics.sql`
- `services/api/app/api/v1/buyer_api.py`
- `services/api/app/marketplace/*`
- `frontend/runtime_console_v3/src/app/api/buyer/*`

---

## 14) Definição de baseline deste documento

Este documento representa o **contexto consolidado até a última alteração registrada da Sprint 15**, servindo como referência única para onboarding técnico, planejamento de release e continuidade de implementação.

