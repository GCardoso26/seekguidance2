# PDV — Bugs Report

**Campanha:** PDV Day Operations + campaign-011  
**Gerado:** 2026-07-22  
**Regra:** só bugs com evidência real de execução ou sessão documentada.

---

## P0

### PDV-BUG-003 — Checkout / Stripe Connect em produção (sessão anterior)

- **Descrição:** Lojista com Stripe no perfil via vendas online; `POST /checkout` retornava 400; `POST .../connect/refresh/{storeId}` retornava 500 (`Account.get` inexistente no Stripe SDK 15). PIX aparentava “não salvar” por leitura de loja errada (owner multi-loja).
- **Passos (resumo):** Configurar Connect → tentar checkout cartão na loja de testes → refresh Connect.
- **Evidência:** Console do lojista (sessão QA anterior); loja `9dc9e0a7-e901-40d2-b0b2-1cc60698b9b1`; mitigação API `d173feb1`. Deploy FE Vercel falhou (`npm ci`/lockfile). **Re-teste E2E pós-fix nesta campanha PDV: Não comprovado.**
- **Impacto:** Bloqueia venda com cartão no fluxo loja/marketplace.
- **Sugestão:** Revalidar Connect + checkout + PIX UI com loja ativa correta após deploy FE; não misturar com PDV balcão sem evidência.

---

## P1

### PDV-BUG-001 — Playwright PDV aborta apesar da UI disponível

- **Descrição:** Em `/vendedor/painel/pdv` a UI mostra heading “PDV”, barcode, busca, carrinho e “Finalizar venda”, mas `skipIfPdvUnavailable` não encontra `data-testid="pdv-manager"` nem upsell e falha o expect — interrompe fluxos dinheiro/PIX/mobile.
- **Passos:**
  1. `BASE_URL=http://127.0.0.1:3000`
  2. `npx playwright test e2e/specs/seller-pdv.spec.ts --project=chromium`
  3. Observar 3 failed / 2 passed
- **Evidência:**
  - `testing/reports/_pdv_playwright_20260722.log`
  - `frontend/runtime_console_v3/test-results/.../error-context.md` (árvore acessível com PDV visível)
- **Impacto:** Impede comprovação E2E de venda no balcão (aceite “PDV completo”).
- **Sugestão:** Instrumentar `pdv-manager` (e testids já usados no spec) **ou** ajustar helper para detectar heading/carrinho sem exigir upsell. Sem mudança de regra de domínio (ADR-015).

---

## P2

### PDV-BUG-002 — Workload PDP Renato 100% 404

- **Descrição:** Carga leve PDP: 25 requisições, 0 OK, status 404 (latências até ~6s na amostra).
- **Passos:** `npm run test:qa:orchestrator` → persona Renato.
- **Evidência:** `testing/reports/persona-renato-performance-latest.json`
- **Impacto:** Métricas de performance de PDP inválidas; risco de URL/seed quebrado.
- **Sugestão:** Alinhar paths/seed do workload PDP ao routing atual.

---

## P3

Nenhum P3 com evidência objetiva registrado nesta rodada.

---

## Bugs não encontrados (orquestrador)

`qa-cursor-handoff.md` / campaign-011: **nenhum P0/P1 novo** na memória operacional da campanha automatizada. Os itens acima são da validação PDV day + contexto produção documentado.

## Regressões

Nenhuma regressão detectada automaticamente pelo orquestrador (`regressions: []`).
