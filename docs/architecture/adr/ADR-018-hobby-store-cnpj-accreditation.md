# ADR-018 — Hobby Store CNPJ-only; Buyer ≠ Seller; Accreditation

**Status:** Accepted  
**Data:** 2026-08-12  
**Tags:** marketplace, seller, identity, accreditation, trust, organization  
**Relaciona:** [ADR-007](./ADR-007-marketplace-domain-boundaries.md) · [ADR-011](./ADR-011-public-api-boundaries.md) · [ADR-012](./ADR-012-lorcana-first-beachhead.md) · [ADR-015](./ADR-015-architecture-freeze-product-first.md) · North Star R1 · [`SELLER_ACCREDITATION_SPEC.md`](../../product/SELLER_ACCREDITATION_SPEC.md)  
**Supersedes:** nada. Endurece identidade de oferta no marketplace; não reabre ADR-015 para features transversais novas além do escopo escrito.

## Context

Problema **observado** (não imaginado):

1. **Confiança de oferta** — loja jurídica (CNPJ) vs revendedor pessoa física (CPF) confunde o buyer e dilui liquidez confiável.
2. **Qualidade de estoque** — plano `free` e criação de loja “só nome” incentivam listagens sem operação real.
3. **Identidade `seller = user`** — não escala equipe, financeiro nem auditoria; a base operacional já existe em `stores` + `store_user_roles`.

North Star R1 mede liquidez de oferta **confiável**. Aceitar CPF-seller e plano free aumenta oferta nominal e **aumenta** incerteza de compra — viola Decision Quality da Platform Constitution.

## Decision

### 1. Só CNPJ cria Organization / loja

- Identidade da loja = **CNPJ** (pessoa jurídica).
- CPF do responsável é identidade do **membro** (owner/manager/operator), nunca da loja.
- `create_store` e qualquer caminho de publicação exigem CNPJ válido (formato + dígitos verificadores).

### 2. Sem plano free para vendedores

- Planos seller válidos para operar: `lojista` | `pro` | `enterprise`.
- Estado pré-aprovação: `pending_accreditation` (sem publicar ofertas).
- `free` permanece só como legado grandfathered até o prazo operacional; não é default nem opção de UI para seller novo.

### 3. Buyer ≠ Seller path

- **Comprar** → conta + perfil buyer (CPF OK) → marketplace.
- **Vender** → landing de credenciamento (`/vender`) → solicitação de aprovação → Organization aprovada.
- Proibido toggle “virar vendedor” / signup unificado com tipo comprador|vendedor.

### 4. Organization (domínio) sobre `stores` + `store_user_roles`

- No corte 1: **não** criar tabela `organizations`. O nome de domínio *Organization / Hobby Store* mapeia para `stores` + membros em `store_user_roles`.
- Corte 2 (fora desta ADR de gates): schema explícito se evidência operacional exigir multi-loja / matriz-filial.

### 5. Accreditation workflow

Estados canônicos: `draft` → `submitted` → `under_review` → `approved` | `rejected`  
(mais `grandfathered` para legado com prazo).

- Publicar oferta/listagem/produto ativo exige `accreditation_status = approved` **ou** `grandfathered` ainda dentro de `accreditation_deadline_at`.
- Após o prazo, sem CNPJ válido → **bloqueio de novas publicações** (lojas existentes não são apagadas no corte 1).
- Consulta CNPJ (BrasilAPI/ReceitaWS via BFF) é **somente leitura**; confirmação humana obrigatória — nunca auto-aprova.

### 6. Trust tiers (produto; implementação gradual)

| Tier | Significado |
|------|-------------|
| 🟢 Verificada | CNPJ + identidade + dados comerciais confirmados (`approved`) |
| 🔵 Estabelecida | Histórico de pedidos, catálogo e avaliações |
| ⭐ Recomendada | Fulfillment, cancelamentos, estoque, resposta, qualidade |

Métricas de engenharia não substituem estes selos nem North Star.

## Non-goals

- Wizard completo de credenciamento (Fase 2 da spec) — autorizado pela ADR, fora do corte de gates.
- Preços comerciais finais dos planos (mínimo pago = `lojista`; valores em código até PRODUCT fechar).
- ERP / API multi-filial completa.
- Corte duro imediato de lojas ativas sem CNPJ.

## Consequences

### Altera

- API `create_store`: CNPJ obrigatório; default de plano deixa de ser `free`.
- Publicação de `card_listings` / `store_products`: gate de accreditation + CNPJ (com grandfather).
- UI: remove card Gratuito; `/stores/create` redireciona para `/vender`; nav “Vender” aponta para credenciamento.
- Schema `stores`: `accreditation_status`, `accreditation_deadline_at`; plano `pending_accreditation` permitido.

### Não altera

- Fronteiras ADR-007 / ADR-011 além dos gates de elegibilidade de seller.
- Beachhead Lorcana (ADR-012) e allowlist TCG.
- Tabela `store_user_roles` como base de equipe.

## Future

- Persistência `store_accreditation_applications` + protocolo `#JTCG-…`.
- Onboarding pós-aprovação: import CSV → match Master Catalog → oferta.
- Selo na vitrine e dashboard operacional alinhados aos trust tiers.
