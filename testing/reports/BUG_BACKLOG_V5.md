# BUG_BACKLOG_V5 — Platform V5 Full Certification

**Campaign date:** 2026-07-23  
**Policy:** Find → document → reproduce → classify. No auto-fix in this campaign.  
**Evidence:** `qa-platform-v5-evidence.json`

---

## P0 — Blockers

### BUG-V5-001 — Checkout live PIX/Stripe/Mercado Pago não certificável
- **Severidade:** P0  
- **Reprodução:** `npx tsx services/api/scripts/_probe-psp-secrets.ts` → `stripe_secret_key_missing`, `mercadopago_access_token_missing`; `CHECKOUT_PAYMENT_GATEWAY=stub(default)`.  
- **Impacto:** Critério obrigatório “Checkout (PIX/Stripe/Mercado Pago) validado” falha. Pagamentos reais não comprovados.  
- **Causa raiz:** Segredos PSP ausentes no ambiente de certificação; gateway em stub.  
- **Correção sugerida:** Provisionar secrets em ambiente controlado e reexecutar matriz live + webhooks.

### BUG-V5-002 — Personas Marina/Carlos E2E incompletas (pré-requisitos ausentes)
- **Severidade:** P0  
- **Reprodução:** Playwright `seller-lifecycle` → 8 skipped (`e2e/.auth/seller.json` e/ou `npm run seed:test` ausentes). Buyer lifecycle depende de `buyer.json`.  
- **Impacto:** Critério “Todas as personas aprovadas” e “Seller/Buyer validados” falham.  
- **Causa raiz:** Setup de auth/seed não executado nesta campanha.  
- **Correção sugerida:** Rodar `e2e:setup-auth` + `seed:test` e reexecutar suites seller/buyer completas.

### BUG-V5-003 — Knowledge Graph não operacional em escala no Marketplace
- **Severidade:** P0  
- **Reprodução:** SQL prod: `store_products=14878`, `master_variant_id IS NOT NULL` = **1**; `collections=0`, `relationships=0`, `packages=0`, contents/specs ≈ 1.  
- **Impacto:** PDP Knowledge Panel / Collections / Related Products não existem para a massa de listagens.  
- **Causa raiz:** Cobertura de vínculo master e enriquecimento oficial insuficientes.  
- **Correção sugerida:** Backfill de vínculos + sync oficial contents/specs/collections; medir % PDP com painel.

---

## P1

### BUG-V5-004 — 100% dos `sync_runs` em `failed` (image fetch)
- **Severidade:** P1  
- **Reprodução:** `SELECT status,count(*) FROM product_catalog.sync_runs GROUP BY 1` → failed=79. Errors: `image:…:fetch failed` (gamegenic/central). Upserts parciais ocorrem (ex.: items_upserted>0) mas status=failed.  
- **Impacto:** Scheduler/Asset ingest não confiável; Asset Health / CDN path quebrado.  
- **Correção sugerida:** Diagnosticar fetch de imagens (URL, rede, rate-limit); não marcar run failed se política permitir soft-fail de assets.

### BUG-V5-005 — Filtro `max_price` não atualiza URL (Marketplace)
- **Severidade:** P1  
- **Reprodução:** `e2e/specs/marketplace-filters.spec.ts` — URL fica `min_price=1&from=marketplace` sem `max_price=500`.  
- **Impacto:** Regressão de busca/filtros marketplace.  
- **Arquivo:** filtros FE marketplace / query sync.

### BUG-V5-006 — Drawer mobile filtros: apply timeout
- **Severidade:** P1  
- **Reprodução:** mesmo spec, mobile: `getByTestId('marketplace-filters-apply')` timeout 60s.  
- **Impacto:** UX mobile marketplace quebrada no E2E.

### BUG-V5-007 — Gate performance/Lighthouse sem execução
- **Severidade:** P1 (gate)  
- **Reprodução:** Nenhum `lighthouse` / load 100–1000 nesta campanha.  
- **Impacto:** Critérios Lighthouse≥95 e Performance falham por ausência de evidência (política: sem inferência).

---

## P2

### BUG-V5-008 — RLS off em schemas commerce (`marketplace`/`payment`/`cart`/`reservation`/`platform`)
- **Severidade:** P2  
- **Reprodução:** `relrowsecurity=false` nas tabelas listadas; mitigações: `anon` USAGE=false nos schemas.  
- **Impacto:** Defense-in-depth fraca se schema for exposto.  
- **Correção sugerida:** RLS deny-by-default (padrão P3 V4 do product_catalog).

### BUG-V5-009 — BullMQ / Redis / Qdrant / R2 / CDN não certificados live
- **Severidade:** P2  
- **Reprodução:** Sem inspeção de filas, DLQ, health Redis/Qdrant/R2 nesta campanha.  
- **Impacto:** Ops Renato não aprovável.

### BUG-V5-010 — Cobertura unitária com 24 skips
- **Severidade:** P2  
- **Reprodução:** Vitest core 120 pass / 24 skip / 0 fail.  
- **Impacto:** Contratos/integração potencialmente não exercitados (DB env).

---

## P3

### BUG-V5-011 — `media.assets=1` apesar de syncs com upserts
- **Severidade:** P3  
- **Reprodução:** SQL `media.assets` count=1 vs syncs com dezenas de upserts.  
- **Impacto:** Pipeline de assets não materializa mídia oficial em volume.

---

## Resumo

| Sev | Abertos |
|-----|---------|
| P0 | **3** |
| P1 | **4** |
| P2 | **3** |
| P3 | **1** |

**Veredito:** NOT READY FOR PRODUCTION
