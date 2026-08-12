# Seller Accreditation Spec — Hobby Store

**Status:** Canonical (Fase 0)  
**ADR:** [ADR-018](../architecture/adr/ADR-018-hobby-store-cnpj-accreditation.md)  
**Superfície alvo (Fase 2):** `/vender` (landing) → `/vender/credenciamento` (wizard)  
**Corte atual:** Fase 3 — pós-aprovação (CSV→match→oferta), trust tiers na vitrine, dashboard operacional.

## Objetivo

Credenciar **hobby stores com CNPJ** como Organizations no JudgeTCG, sem transformar buyer em seller e sem plano free.

## Estados

| Status | Significado | Pode publicar ofertas? |
|--------|-------------|------------------------|
| `draft` | Rascunho do pedido | Não |
| `submitted` | Enviado; protocolo `#JTCG-…` emitido | Não |
| `under_review` | Análise JudgeTCG | Não |
| `approved` | Credenciada | Sim (com plano pago ativo) |
| `rejected` | Recusada (pode reenviar) | Não |
| `grandfathered` | Legado com `accreditation_deadline_at` | Sim até o prazo; depois exige CNPJ + `approved` |

## Fluxo (passos 1–15)

### Landing — Venda no JudgeTCG (`/vender`)

Não é signup. Copy e seções:

- Headline: **Venda seus produtos no JudgeTCG**
- Sub: Conecte sua hobby store a um marketplace especializado em TCGs
- Quem pode vender (CNPJ / hobby store)
- Como funciona a aprovação
- Documentos necessários
- TCGs suportados
- Estoque, pagamentos, taxas, envio, atendimento
- Prazo de aprovação
- CTA: **Solicitar credenciamento** (não “Criar conta seller”)

### Passo 1 — Identificação da loja

Campos: nome comercial, CNPJ, site, Instagram, WhatsApp comercial, cidade, UF, tipo (física / online / ambas).

### Passo 2 — Verificação do CNPJ

1. Lookup BFF `GET /api/stores/cnpj-lookup?cnpj=`
2. Exibir razão social, fantasia, situação, endereço, CNAE
3. Confirmação humana obrigatória — **não** auto-aprova

### Passo 3 — Responsável

Relação com a loja (proprietário / sócio / gerente / e-commerce / autorizado), nome, CPF, e-mail profissional, telefone.  
CPF = membro; CNPJ = Organization.

### Passo 4 — Perfil hobby store

TCGs comercializados, categorias (singles, selados, acessórios, decks, colecionáveis, importados), canais atuais de venda.

### Passo 5 — Evidência comercial

Pelo menos uma: site, Instagram, Google Business, fotos (fachada / atendimento / estoque), marketplace existente, documento. Alimenta trust score inicial.

### Passo 6 — Operação

Faixas de SKUs e pedidos/mês; estoque integrado; método de sync (API / CSV / ERP / manual / ainda não sei).

### Passo 7 — Resumo + regras

Checkboxes obrigatórios (estoque atualizado, preços reais, envio conforme anúncio, condição, cancelamento/devolução, dados atualizados) → `submitted` + protocolo `#JTCG-{seq}`.

### Passo 8 — Em análise

Tela de status (não “cadastro realizado”): checklist Dados → Identidade → Perfil → Análise → Aprovação → Catálogo → Primeira oferta.

### Passo 9 — Pós-aprovação

CTAs: conectar catálogo → pagamentos → envio → publicar ofertas → primeira venda.  
**Sem** cadastro manual de produto no onboarding.

### Passo 10 — Catálogo

Import CSV (`sku,name,set,condition,language,price,quantity`) → match Master Catalog → oferta.

### Passos 11–13 — Dashboard, selo, trust tiers

Ver ADR-018 §6. Painel operacional evolui o shell atual; não criar shell paralelo.

### Passos 14–15 — Anti-padrões e identidade

Proibido: signup com tipo comprador|vendedor; “Quer vender?” genérico a partir de buyer.  
Modelo: `JudgeTCG Account` → Buyer **ou** Organization (Hobby Store) com Owner / Manager / Operator.

## Persistência (Fase 2)

Tabela `store_accreditation_applications` (migration `20260812200000_…`):

- `id`, `protocol` (`#JTCG-…` no submit), `store_id` (nullable até aprovação)
- `applicant_user_id`, `status`, `answers` JSONB, `cnpj`, `trust_score_initial`, timestamps
- API: `GET/POST …/accreditation`, `PATCH …/accreditation/{id}`, `POST …/accreditation/{id}/submit`
- UI: `/vender/credenciamento`
- Ligação a `stores.id` + `store_user_roles` (`store_owner`) na **aprovação** (Fase 3 / ops)

## Entrega Fase 3

- **Aprovação:** admin `approve` provisiona/ativa `stores` + `store_user_roles(store_owner)` + `trust_tier=verified`
- **CSV cartas:** `POST …/inventory/import-csv` com `kind=cards` → match `card_catalog` → `create_listing` (preço/qty/condition); `dry_run` opcional; atualiza `last_inventory_sync_at`
- **Trust:** colunas `stores.trust_tier` / `last_inventory_sync_at` (migration `20260812210000_…`); selo na vitrine (`TrustTierBadge`) + métricas públicas (pedidos, cancel_rate)
- **Painel:** `post_approval_onboarding` + `stock_sync` + vendas hoje no overview existente (não shell novo)

## Gates Fase 1 (obrigatórios agora)

- Impossível criar loja sem CNPJ válido
- Impossível publicar oferta sem accreditation aprovada (ou grandfather vigente)
- Plano `free` fora da UI e fora do default de loja nova
- Entry “Vender” → `/vender`

## Grandfather ops

- Lojas existentes sem CNPJ ou `subscription_plan = free` recebem `accreditation_status = grandfathered` e `accreditation_deadline_at` (default 45 dias na migration)
- Banner no painel até regularização
- Script ops lista lojas em risco; **não** apaga lojas no corte 1
