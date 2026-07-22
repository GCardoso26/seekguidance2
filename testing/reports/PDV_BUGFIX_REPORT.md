# PDV Bugfix Report — Stabilization Sprint

**Data:** 2026-07-22  
**Modo:** Bug Fix Only (ADR-008–011, ADR-015)  
**Arquitetura:** sem novos BCs, sem mudança de domínio/UX/DS

## Resumo

| Bug | Prioridade | Status | Evidência |
| --- | --- | --- | --- |
| PDV-BUG-003 Stripe Connect / checkout / multi-loja | P0 | **Corrigido em código** + testes unitários; checkout cartão/PIX **ao vivo autenticado: NÃO COMPROVADO** | unitários + 401 unauth (não 500) |
| PDV-BUG-001 Playwright PDV | P1 | **Corrigido e comprovado** | Playwright 5/5 PASS |
| PDV-BUG-002 Renato PDP 404 | P2 | **Corrigido e comprovado** | PDP 25/25 HTTP 200 |

---

## P0 — PDV-BUG-003

### Reprodução (documentada)
- `POST .../checkout` → 400 (loja sem `stripe_onboarding_complete`)
- `POST .../connect/refresh/{storeId}` → 500 (`Account.get` inexistente no Stripe SDK 15)
- PIX “não salva” por loja ativa errada (multi-loja)

### Causa raiz
1. SDK Stripe 15: objeto `Account` sem `.get()` → crash no refresh.
2. Ordem de seleção de loja inconsistente entre Connect (`get_owner_store`) e dashboard (`resolve_owner_store`).
3. Painel FE às vezes lia loja diferente do dashboard (já mitigado em `useSellerStore` / commit anterior).

### Correção aplicada
- Já em `d173feb1`: `stripe.Account.retrieve` + helpers `_stripe_account_flag` / V2 retrieve (sem `Account.get`).
- Nesta sprint:
  - Alinhar `get_owner_store` e `list_owner_stores` à mesma ordem do dashboard (shop_enabled → plano → `created_at DESC`).
  - Testes: `tests/marketplace/test_stripe_connect_sdk15.py` (6 passed).

### Arquivos
- `services/api/app/marketplace/shop_connect.py`
- `services/api/app/stores/store.py`
- `services/api/tests/marketplace/test_stripe_connect_sdk15.py`
- (pré-existente) `frontend/.../useSellerStore.ts`, `PixConfigForm.tsx`

### Evidência de funcionamento
| Check | Resultado |
| --- | --- |
| `Account.get(` no source | Ausente (assert no teste) |
| pytest SDK15 | **6 passed** |
| `POST connect/refresh` sem auth | **401** (não 500) |
| Checkout cartão autenticado em prod | **NÃO COMPROVADO** (sem sessão lojista nesta execução) |
| Checkout PIX autenticado em prod | **NÃO COMPROVADO** |
| Persistência PIX multi-loja E2E | **NÃO COMPROVADO** (alinhamento de código + FE prévio) |

---

## P1 — PDV-BUG-001

### Reprodução
UI PDV visível (heading, busca, carrinho); helper `skipIfPdvUnavailable` checava `pdv-manager` **sem esperar** o `dynamic()` → falhava exigindo upsell.

### Causa raiz
Race: shell da página renderiza antes do chunk de `PdvManager` (`data-testid="pdv-manager"` já existia).

### Correção
Helper aguarda até 20s `pdv-manager` **ou** `pdv-cart` **ou** `pdv-barcode-input` antes de concluir unavailable.

### Arquivo
- `frontend/runtime_console_v3/e2e/specs/seller-pdv.spec.ts`

### Evidência
`testing/reports/_bugfix_playwright_pdv.log` — **5 passed (39.1s)**  
Inclui mobile + fluxo dinheiro + fluxo PIX.

---

## P2 — PDV-BUG-002

### Reprodução
Workload usava `/loja/cartas/rapunzel` (slug) → **404**. UUID real → **200**.

### Causa raiz
Seed incorreto (nome em vez de `cardId` de catálogo). Rota OK.

### Correção
Resolver IDs via `GET /api/catalog/cards/search` e manter URL `/loja/cartas/{uuid}`.

### Arquivo
- `testing/personas/runners/renato-performance-audit.mjs`

### Evidência
`persona-renato-performance-latest.json` — PDP **ok: 25 / count: 25**, status 200 na amostra.

---

## Regressões

- Typecheck FE: PASS (`_bugfix_typecheck.log`)
- Vitest PDV: 10/10 PASS
- Gates/smoke local: PASS
- Playwright PDV: 5/5 PASS
- Renato: PASS (PDP verde)
- **Nenhuma regressão detectada** nos checks acima

## Conclusão objetiva

Bugs P1 e P2 **comprovados corrigidos**.  
P0 **corrigido em código + regressão unitária**; validação E2E autenticada de checkout cartão/PIX em produção permanece **NÃO COMPROVADO** até sessão lojista real pós-deploy.
