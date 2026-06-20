# Smoke Test Resultado — 2026-06-20 (atualizado 18:16 BRT)

## Status: ⏳ PENDENTE — smoke test PIX manual (12 passos)

**Commit de referência:** `3030b510` — marketplace neutro (PIX padrão, Stripe opcional)  
**Modelo:** zero comissão · PIX direto · Pro R$ 49/mês

---

## Infra — verificação automatizada (20/06 18:16)

| Check | Resultado |
|-------|-----------|
| Render `/v1/health` | ✅ 200 |
| Vercel `/marketplace` | ✅ 200 |
| Vercel `/store/dashboard?tab=pagamentos` | ✅ 200 (bundle `page-f1267deecc46bafe.js`) |
| Vercel deploy `3030b510` | ✅ [run 27883905600](https://github.com/GCardoso26/seekguidance2/actions/runs/27883905600) |
| Supabase migration PIX | ✅ `20260620180000_marketplace_neutro_pix_pro.sql` aplicada |
| `GET /checkout/methods` sem auth | ✅ 401 (esperado) |
| `POST /checkout/pix` sem auth | ✅ 401 (esperado) |
| API Render com auth fake + carrinho vazio | ✅ 400 `"Carrinho vazio"` (rota PIX ativa) |

**Render:** Live. Cold start pode levar >45s após idle.

---

## Smoke test PIX — checklist manual (VOCÊ)

Abra o browser e marque cada passo. **Não iniciar POS/estoque até todos ✅.**

| # | Passo | Esperado | Status | Observação |
|---|-------|----------|--------|------------|
| 1 | Login Google | Logado | ⬜ | |
| 2 | `/store/dashboard?tab=pagamentos` | Aba **Pagamentos** | ⬜ | |
| 3 | Salvar PIX (CPF + chave teste) | "PIX configurado!" | ⬜ | |
| 4 | Aba Produtos → Novo | Formulário | ⬜ | |
| 5 | Sleeves YGO, 2990 centavos, estoque 10, sleeve | Salvo | ⬜ | Preço = centavos |
| 6 | `/marketplace` | Produto no grid | ⬜ | |
| 7 | Outra conta → comprar | Checkout PIX | ⬜ | |
| 8 | Gerar PIX | QR + copia e cola | ⬜ | |
| 9 | Simular pagamento | — | ⬜ | Manual (sem gateway ainda) |
| 10 | Lojista → Pedidos | Status `pending` | ⬜ | |
| 11 | **Confirmar PIX** | Status `paid` | ⬜ | |
| 12 | Aba Produtos | Estoque 9 | ⬜ | |

### Se falhar

1. F12 → Console + Network  
2. Anotar passo + URL + status + `detail` do JSON  
3. Enviar ao Cursor para debug

---

## Resultado por bloco (preencher após teste)

| Bloco | Status | Observação |
|-------|--------|------------|
| 1–3 Config PIX | ⬜ | |
| 4–6 Produto | ⬜ | |
| 7–9 Checkout | ⬜ | |
| 10–12 Confirmação + estoque | ⬜ | |

---

## Próximo (após ✅ PASSOU)

- [ ] POS (`/pos`) — frente de caixa Pro
- [ ] Estoque (`stock_movements`)
- [ ] Webhook PIX automático (Mercado Pago / Pagar.me)

## Bloqueios conhecidos

| Item | Impacto |
|------|---------|
| Stripe Connect não ativado na plataforma | Só afeta **cartão** — PIX não depende |
| Confirmação PIX manual | Lojista clica "Confirmar PIX" até integrar gateway |
| Loja existente sem PIX | Configurar em Pagamentos antes de vender |

---

## Histórico

| Data/Hora | Executor | Resultado |
|-----------|----------|-----------|
| 2026-06-20 15:35 | Cursor (auto) | Infra OK; smoke Stripe 17 passos pendente |
| 2026-06-20 18:16 | Cursor (auto) | Infra OK pós-3030b510; smoke PIX 12 passos pendente |
| | **Você (manual)** | ⬜ Preencher acima |
