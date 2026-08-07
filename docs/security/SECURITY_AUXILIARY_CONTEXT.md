# JudgeTCG — Security Auxiliary Context

**Tipo:** briefing operacional para ferramentas auxiliares de segurança (agente Cursor `security-review`, scanners, auditor LLM, revisão humana).  
**Não é:** PoC de exploit, runbook de ataque, nem lista de secrets.  
**Atualizado:** 2026-08-07  
**Repo:** `GCardoso26/seekguidance2` (local típico `S:/tcg-judge`)  
**Produto:** JudgeTCG — marketplace TCG + assistente de regras (`judgetcg.com.br`)

**Estágio:** Framework Complete → Evidence Release (R4). Beta não iniciado. Seeds/simulação em Beta = **proibido**.

### Remediações aplicadas (2026-08-07)

| Gap | Mitigação |
| --- | --- |
| PIX Manual/Asaas fail-open | `verify_webhook` exige secret/token |
| Ledger financeiro aberto | Mutators exigem `platform.admin` / `store.finance.*` |
| Dashboard `store_id` IDOR | Ownership + marketplace só admin; `seller()` filtra por loja |
| Melhor Envio unsigned | Fail-closed + 503 sem secret |
| PDV preço do cliente | Preço canônico do DB |
| Payout sem saldo | Gate `escrow_balances.available_cents` |
| Estoque PIX duplo | FOR UPDATE + nota `stock_deducted` |
| Admin password `admin` no Render | Removido; senha fraca ignorada em production |
| Config produção incompleta | `STRIPE_WEBHOOK_SECRET`, `RUNTIME_AUTH_SECRET`, CORS ≠ `*` hard-required |
| `service_role` no FE | `key-guard` fail-closed |
| Sandbox fail-open | Entitlements fail-closed em erro de API |
| CSV ilimitado | max 2MB (API + BFF) |
| RLS shop_orders / listings | SELECT/UPDATE + trigger anti-tamper; seller CRUD |

### Regras absolutas para a ferramenta

1. Sem exploits / PoCs / payloads de ataque — reportar localização, impacto e mitigação.
2. Não inventar secrets nem sugerir commit de `.env` / chaves.
3. Não afrouxar ADRs nem a Platform Constitution para “facilitar” o fix.
4. Preferir defeitos reais no diff/código a hipóteses genéricas de OWASP.
5. Em produção (`ENVIRONMENT=production`): JWT spoof / fail-open de auth = **P0**.

Fontes canônicas: `docs/architecture/PLATFORM_CONSTITUTION.md` · `PROJECT_STATUS.md` · `docs/SECURITY.md` · `docs/validation/SECURITY_AUDIT.md` · `docs/SECURITY_CREDENTIAL_ROTATION.md`

---

## 1. Superfície e Trust Boundaries

| Boundary | Confiar em | Não confiar em |
| --- | --- | --- |
| Browser → Next | Cookies HttpOnly + JWT | Headers forjáveis como identidade final |
| Next BFF → API | Validação server-side + `Authorization` | `X-Judge-User-Id` sozinho em produção |
| Stripe/PIX → API | Assinatura webhook + idempotência | Metadata do cliente sem verificação no DB |
| Seller panel → API | Owner/store binding + KYC obrigatório | IDs de loja/pedido só no path |

```text
Browser (judgetcg.com.br)
  └─ Next.js 15 (Vercel) — frontend/runtime_console_v3
       ├─ BFF /api/* (cookies HttpOnly, proxy)
       └─ FastAPI (Render) — services/api
            ├─ Postgres/Supabase (tcg_judge, RLS)
            ├─ Redis · Stripe · PIX / Melhor Envio
```

---

## 2. Modelo de Identidade

- **Supabase Auth:** JWT; FE usa **anon key** (`NEXT_PUBLIC_*`). `service_role` nunca no client.
- **Header `X-Judge-User-Id`:** derivar de JWT validado no BFF/API — não aceitar cegamente do browser em produção.
- **KYC / conta ativa:** checkout exige `require_active_account`; bypass = fraude de compra.
- **RBAC multi-tenant:** revisar todos IDOR — `store_id` / `order_id` / `listing_id` / `buyer_id` autorizados contra o actor.

Ameaças de referência (`docs/validation/SECURITY_AUDIT.md`): SEC-001/002/ADM-001 = P0; SEC-003–006, SEL-002 = P1.

---

## 3. Domínios de Alto Risco

### Pagamentos

| Área | Paths |
| --- | --- |
| Stripe webhook | `services/api/app/api/v1/stripe_billing.py` |
| Pedido pago + estoque | `services/api/app/marketplace/shop_orders.py` |
| PIX | `services/api/app/marketplace/shop_pix.py` |
| Checkout atômico | `services/api/app/marketplace/checkout_atomic.py` |
| PI create | `services/api/app/marketplace/shop_checkout.py` |
| Escrow | `services/api/app/marketplace/shop_escrow.py` |

- Stripe webhook: verificar assinatura + idempotência.
- Checkout atomic: só baixar estoque em pagamento concluído (`finalize_checkout` / `deduct_stock_for_order` idempotente).
- Escrow: separar custódia de permissões de payout.

### Seller

| Área | Paths |
| --- | --- |
| Dashboard | `services/api/app/api/v1/seller_dashboard_api.py` |
| Listings / inventário | `services/api/app/marketplace/card_listings.py`, `seller_inventory_*.py` |
| PDV | `services/api/app/marketplace/shop_pdv.py` |
| FE painel | `frontend/runtime_console_v3/src/app/vendedor/**` |

- Dashboard: ownership da loja.
- PDV: validar mutação preço/estoque.
- CSV upload: verificar payload / content-type.

### Dados

- RLS: cobrir buyer read vs store owner write (`supabase/migrations/`, schema `tcg_judge.*`).
- Service role: só no backend.
- Rate limit: `services/api/app/main.py` + `app/core/rate_limit.py`.

---

## 4. Secrets e Configuração

**Obrigatórios em produção (Render):** `ENVIRONMENT`, `DATABASE_URL`, `REDIS_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RUNTIME_AUTH_SECRET`, `CORS_ALLOWED_ORIGINS`.

**Obrigatórios no FE (Vercel):** `API_PROXY_TARGET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (JWT role = **anon**).

**Nunca:**

- Commitar `.env`, chaves em `*.example`, dumps em `.tmp/` / `key/`.
- Prefixar `service_role` com `NEXT_PUBLIC_`.
- Desabilitar verificação de webhook em `main`.

Rotação: `docs/SECURITY_CREDENTIAL_ROTATION.md`.

---

## 5. CI Gates

| Job | Critério |
| --- | --- |
| Secrets scan | TruffleHog `--only-verified` (`.github/workflows/security-scan.yml`) |
| npm audit | `continue-on-error: true` (não mascara falha de secrets) |
| Build FE | `npm run build` em `frontend/runtime_console_v3` |

---

## 6. Formato de Saída Esperado

```text
Severity: Critical | High | Medium | Low | Info
Location: path/to/file:line
Finding: <descrição concisa>
Impact: <o que atacante consegue>
Fix direction: <mitigação concreta, sem PoC>
```

Ordenar por severidade. Sem achado material: `No material security findings`.

**Descartar:** depreciações npm sem vetor; ruído de browser (Cloudflare integrity/adblock); “rate limit genérico” sem evidência no path; refactors cosméticos fora do trust boundary.

---

## 7. Prompt Curto

```text
Você é revisor de segurança do JudgeTCG. Use docs/security/SECURITY_AUXILIARY_CONTEXT.md.
Foque: auth/IDOR, webhooks Stripe/PIX, baixa de estoque idempotente, RLS multi-loja, secrets no FE, fail-open de auth.
Não produza exploits nem PoCs. Reporte só achados materiais com Severity, Location, Finding, Impact, Fix direction.
Hierarchy: Constitution → ADRs → código. Não proponha afrouxar ADRs.
```
