# Seller Experience Contract — Sprint 7

**Status:** Congelado antes do frontend — Sprint 7  
**KPI North Star:** Tempo entre **criar conta de vendedor** e **publicar o primeiro anúncio** — **P50 &lt; 60s** · **P95 &lt; 120s**  
**Relaciona:** [`MARKETPLACE_DOMAIN.md`](../architecture/MARKETPLACE_DOMAIN.md) · [`IDENTITY_DOMAIN.md`](../architecture/IDENTITY_DOMAIN.md) · [`READ_MODEL_CONTRACT.md`](../architecture/READ_MODEL_CONTRACT.md) · [`MVP_1_0_RELEASE_PLAN.md`](../architecture/MVP_1_0_RELEASE_PLAN.md) · [ADR-007](../architecture/adr/ADR-007-marketplace-domain-boundaries.md)

## Princípio central

O lojista **não** pensa em `catalogVariantId` nem em agregados.

Ele pensa:

> “Vou vender esta carta.”

O frontend traduz intenção humana → APIs já existentes.  
**Sem novas regras de domínio.**

## Regra arquitetural (inviolável)

```text
Frontend (apps/web)
  → AuthApiClient / MarketplaceApiClient / PublicApiClient
  → /api/v1/*
  → Identity · Marketplace · Search Projection
```

**Proibido:**

```text
Frontend → Catalog Repository
Frontend → Marketplace Repository
Frontend → Order Repository
Frontend → SQL / Postgres
```

## Jornada do vendedor (única)

```text
1. Criar conta (buyer role automático)
2. Criar loja (onboard seller → role seller)
3. Buscar carta (Search / Public API)
4. Selecionar carta (catalogCardId + variant)
5. Informar dados comerciais
6. Publicar anúncio (Inventory + Listing)
7. Ver anúncio ativo (opcional: lista “Meus anúncios”)
```

Meta de tempo: passos 1→6 em **&lt; 60s** (usuário treinado no fluxo; sem fricção de UI).

## Estados de onboarding

| Estado | Significado | UI permitida |
|--------|-------------|--------------|
| `anonymous` | Sem JWT | Login / Register |
| `buyer_only` | Conta criada, sem loja | CTA “Criar loja” |
| `seller_pending` | Loja criada, onboarding mínimo | Portal seller |
| `seller_active` | Pode publicar | Fluxo publicar + Meus anúncios |

Sprint 7 **não** exige verificação fiscal/endereço (isso é Fase 2 / Sprint 8).  
`seller_pending` e `seller_active` podem colapsar em “tem SellerProfile” para o MVP.

## Modelo mental vs domínio

| Usuário vê | Backend faz |
|------------|-------------|
| “Esta carta” | Resolve `catalogCardId` / `catalogVariantId` via Search |
| “Quantidade” | `AdjustInventory` / inventory write |
| “Preço / condição / idioma / foil” | `PublishListing` |
| “Publicar” | `POST /api/v1/marketplace/listings` (+ inventory se necessário) |

O formulário **nunca** pede IDs técnicos ao usuário.

## Telas permitidas (Sprint 7)

| Rota (sugerida) | Propósito |
|-----------------|-----------|
| `/seller` | Home do portal (CTA criar loja / publicar) |
| `/seller/onboard` | Criar loja (displayName) |
| `/seller/listings/new` | Wizard 3 passos: buscar → dados → publicar |
| `/seller/listings` | Lista “Meus anúncios” (somente leitura + editar básico) |
| `/seller/listings/:id/edit` | Editar preço/qtd/status (mínimo) |

**Uma composição por tela.** Sem dashboard, sem gráficos, sem “esta semana”.

### Wizard — publicar anúncio

**Passo 1 — Buscar**

```text
Digite: Rapunzel – Gifted with Healing
→ resultados oficiais (nome + set)
→ Selecionar
```

**Passo 2 — Dados comerciais**

```text
Quantidade · Condição · Idioma · Foil · Preço (R$)
```

**Passo 3 — Publicar**

```text
[ PUBLICAR ANÚNCIO ]
→ loading → sucesso com link “Ver anúncio” / “Meus anúncios”
```

Estados obrigatórios: loading · error · empty (busca sem resultado) · success.

## APIs consumidas (somente existentes)

| Ação | API |
|------|-----|
| Register / Login / Refresh | `/api/v1/auth/*` |
| Criar loja | `POST /api/v1/marketplace/sellers` |
| Inventory | `POST/PATCH /api/v1/marketplace/inventory` |
| Publicar / editar listing | `POST/PATCH /api/v1/marketplace/listings` |
| Buscar carta | `GET /api/v1/search` (Public API) |
| Ofertas da carta (validação) | `GET /api/v1/marketplace/cards/:id/offers` |

Clients HTTP tipados: `AuthApiClient` · `MarketplaceApiClient` · `PublicApiClient`.  
Nada de `fetch` espalhado.

## Eventos de produto (funil seller)

Instrumentar no frontend (analytics leve / logs estruturados):

| Evento | Quando |
|--------|--------|
| `seller_signup_started` | Abre register |
| `seller_signup_completed` | Register 201 |
| `seller_shop_created` | Onboard seller 201 |
| `seller_first_search` | Primeira busca no wizard |
| `seller_card_selected` | Seleciona resultado |
| `seller_listing_publish_started` | Clique PUBLICAR |
| `seller_listing_published` | Listing 201 |
| `seller_time_to_first_listing_ms` | Delta signup→published (ou shop_created→published) |

North Star derivado: distribuição de `seller_time_to_first_listing_ms`.

## Funil (métricas)

```text
Cadastro iniciado
  → Cadastro concluído
  → Loja criada
  → Primeira busca
  → Primeiro anúncio publicado
```

Taxa de conversão loja→anúncio é o sinal de fricção do wizard.

## Critérios de aceite (seller)

- [x] Pessoa sem explicação externa: conta → loja → anúncio ativo (E2E Playwright)
- [ ] P50 time-to-first-listing &lt; 60s (teste interno cronometrado com humano)
- [ ] Listing aparece em ofertas da carta (Public/Marketplace read) — validar com stack local
- [x] JWT + refresh funcionando no portal
- [x] Empty / loading / error states no wizard

## Fora de escopo (bloqueado na Sprint 7)

| ❌ | Motivo |
|----|--------|
| Dashboard / gráficos / analytics de vendas | Não gera primeiro anúncio |
| Upload de imagem | Não é gargalo do primeiro GMV |
| Chat comprador–vendedor | Não cria liquidez |
| Avaliação / reputação | Prematuro |
| Dados fiscais / endereço completo | Sprint 8 (beta) |
| Condição ultra-detalhada além do enum atual | Evitar scope creep |
| Novas regras de domínio / novos ADRs | Frontend só consome |
| BFF | APIs versionadas bastam |

## Definition of Done (seller half)

Teste cego interno:

1. Criar conta  
2. Criar loja  
3. Publicar **Rapunzel – Gifted with Healing** (ou carta Lorcana indexada)  
4. Confirmar anúncio visível como comprador na página da carta  

Sem ajuda externa. Cronômetro &lt; 60s no happy path.

## Próximo

Após este contrato + [`BUYER_EXPERIENCE_CONTRACT.md`](./BUYER_EXPERIENCE_CONTRACT.md):  
execução mecânica em `apps/web` (Sprint 7.1 → 7.4).
