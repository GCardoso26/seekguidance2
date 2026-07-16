# MVP 1.0 Release Plan — JudgeTCG

**Status:** Congelado — pós Sprint 6 (90D concluído)  
**Objetivo:** **Primeira venda real em produção**  
**Relaciona:** [`ROADMAP_90D.md`](./ROADMAP_90D.md) · [`FOUNDATION_OPERATIONS.md`](../operations/FOUNDATION_OPERATIONS.md) · [`SYSTEM_FLOW.md`](./SYSTEM_FLOW.md)

## Mudança de estágio

| Antes (90D) | Agora |
|-------------|--------|
| Risco: “conseguimos construir?” | Risco: “alguém usa e paga?” |
| Foco: arquitetura + invariantes | Foco: liquidez + go-to-market |
| Entrega: plataforma certificada | Entrega: GMV real |

**Não** é ciclo de “mais arquitetura”.  
É **operação + validação de mercado + expansão controlada**.

## Estado pós Sprint 6

| Domínio | Status |
|---------|--------|
| Catalog / Scryfall Sync | ✅ Produção-ready |
| PostgreSQL Certification | ✅ |
| Outbox / Event Driven | ✅ |
| Search Projection | ✅ |
| Public API Read Model | ✅ |
| Marketplace | ✅ |
| Identity + RBAC | ✅ |
| Seller Listing Flow | ✅ |
| Checkout | ✅ |
| Reservation Engine | ✅ |
| Payment Context | ✅ |
| Observabilidade | ✅ |
| Chaos Testing | ✅ |
| Golden Path | ✅ |

**MVP arquitetural = fechado.**

## Invariantes já provadas (não reabrir)

### 1. Catalog = Source of Truth

```text
Scryfall → Catalog → Outbox → Search Projection → Public API
```

Nenhum domínio comercial contamina o catálogo.  
Permite novos providers / TCGs / rebuild de índice sem quebrar marketplace.

### 2. Marketplace = overlay

```text
CatalogCard + Listing/Inventory/Seller → RenderedCard
```

Listing guarda só: preço · condição · idioma · finish · IDs de referência.  
**Não** copia nome/raridade/oracle/imagem oficiais.

### 3. Checkout com consistência financeira

```text
Cart → preço snapshot → Reservation → Payment → Order
```

- Preço no pedido não muda se Listing subir depois.  
- Estoque=1 · A vs B → um HELD · outro OUT_OF_STOCK (sem oversell).

### 4. Payment isolado

```text
Order ≠ Payment
```

Fake → Stripe → Mercado Pago → Adyen sem reescrever checkout.

---

## Roadmap 30–60–90 pós-MVP

### Fase 1 — Hardening (30 dias)

**Objetivo:** pronto para primeiros usuários reais.

#### 1. Segurança Identity (prioridade alta)

Hoje: JWT + Session + RBAC.  
Falta operacional:

- [ ] Verificação de e-mail
- [ ] Password reset
- [ ] Rate limit login
- [ ] Bloqueio por tentativa

#### 2. Seller experience (KPI principal)

```text
Criar conta → Criar loja → Buscar carta
  → qtd · condição · idioma · preço → Publicar
```

**Meta: &lt; 60 segundos até o primeiro anúncio.**

#### 3. Frontend mínimo (não dashboard gigante)

**Comprador:** Busca · Página da carta · Ofertas · Carrinho · Checkout  

**Lojista:** Meus anúncios · Estoque · Criar anúncio · Pedidos  

### Fase 2 — Marketplace Beta (60 dias)

**Objetivo:** 10–50 lojas reais.

- [ ] Seller onboarding completo (fiscal · endereço · contato)
- [ ] Listing: fotos · observações · condição detalhada (NM / LP / MP …)
- [ ] Busca avançada: cor · CMC · tipo · raridade · set · preço · condição · idioma · foil

### Fase 3 — Monetização (90 dias)

**Antes de IA · outros TCG · social.**

Opções (escolher uma e medir):

| Modelo | Exemplo |
|--------|---------|
| Comissão | 5% sobre venda |
| Plano lojista | Free (ex.: 100 anúncios) · Pro (R$49/mês · ilimitado · destaque · analytics) |

---

## O que NÃO fazer ainda

| Bloqueado | Motivo |
|-----------|--------|
| ❌ IA | Multiplicador — não cria liquidez |
| ❌ Pokémon / YGO / Lorcana | Só após GMV MTG validado (via Provider Adapter) |
| ❌ Social (feed · chat · seguidores) | Marketplace morre por falta de oferta/demanda, não de rede |

Expansão de TCG correta:

```text
MTG funcionando → Provider Adapter → Pokémon / Lorcana / YGO
```

---

## Checklist Release 1.0 — “Primeira venda real”

### Técnico

- [ ] Deploy produção
- [ ] Backup automático (ver [`BACKUP_POLICY.md`](../operations/BACKUP_POLICY.md))
- [ ] SSL
- [ ] Logs centralizados
- [ ] Monitoramento ativo (Prometheus · Grafana · alertas Sprint 6)

### Produto

- [ ] Cadastro seller
- [ ] Cadastro comprador
- [ ] Primeiro anúncio (&lt; 60s)
- [ ] Primeira compra (Cart → Reservation → Payment real → Order)

### Negócio

- [ ] 10 lojas convidadas
- [ ] 1000 cartas indexadas (mínimo útil)
- [ ] 500 anúncios
- [ ] Primeiro GMV &gt; 0

---

## Sequência de sprints sugerida

| Sprint | Foco |
|--------|------|
| **7** | ✅ Frontend comprador + Seller Portal — [`SPRINT_7_DOD.md`](../product/SPRINT_7_DOD.md) |
| **8** | Beta fechado com lojas — [`SPRINT_8_PLAN.md`](../product/SPRINT_8_PLAN.md) |
| **9** | Pagamento real + comissão |
| **10** | Expansão de providers (só se GMV validar) |

## Princípio de decisão

O mais difícil do JudgeTCG **agora não é tecnologia**.

É criar **liquidez** entre oferta e demanda.

A fundação técnica (90D) está alinhada para isso.  
Qualquer feature nova deve responder: **aumenta anúncios, compradores ou GMV?**  
Se não, fica fora.
