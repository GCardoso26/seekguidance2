# Stripe Setup — Judge TCG

Script CLI que cria produtos, prices e webhook no Stripe e gera ficheiros `.env` prontos a copiar.

## Instalação

```bash
cd scripts
npm install
```

## Uso

### Modo teste (desenvolvimento)

```bash
npm run setup:stripe:test
```

Ou, a partir da raiz do monorepo:

```bash
node scripts/setup-stripe.js --env=test
```

### Modo live (produção)

Só usar quando a conta Stripe estiver ativada para pagamentos reais.

```bash
npm run setup:stripe:live
```

Podes passar a secret key via ambiente:

```bash
set STRIPE_SECRET_KEY=sk_test_...
npm run setup:stripe:test
```

## O que o script faz

1. **Produtos**
   - Judge TCG — Spike (PRO)
   - Judge TCG — Equipe (Team)

2. **Prices** (USD, trial 14 dias)
   - Spike mensal: $15/mês
   - Spike anual: $144/ano (~$12/mês, −20%)
   - Equipe mensal: $49/mês
   - Equipe anual: $468/ano (~$39/mês, −20%)

3. **Webhook** (opcional; Enter aceita o URL por defeito do Render)
   - Endpoint: `https://seekguidance.onrender.com/runtime/judge/stripe/webhook`
   - Eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`

4. **Output** em `scripts/output/` (não versionado)
   - `.env.local.stripe.test` → copiar para `frontend/runtime_console_v3/.env.local`
   - `.env.stripe.test` → copiar para `services/api/.env`

## Idempotência

Seguro para correr várias vezes: reutiliza produtos, prices e webhooks com o mesmo nome/URL/valores em vez de duplicar.

## Cartões de teste

| Número | Resultado |
|--------|-----------|
| 4242 4242 4242 4242 | Sucesso |
| 4000 0000 0000 0002 | Cartão recusado |
| 4000 0000 0000 9995 | Fundos insuficientes |
| 4000 0000 0000 3220 | 3D Secure obrigatório |

## Webhook em desenvolvimento local

```bash
stripe listen --forward-to localhost:8000/runtime/judge/stripe/webhook
```

Copia o `whsec_...` que o CLI mostra para `STRIPE_WEBHOOK_SECRET` no `.env` da API.

## Resolução de problemas

**API Key inválida**  
A key deve começar com `sk_test_` (teste) ou `sk_live_` (live) e corresponder ao flag `--env`.

**Produto já existe**  
O script reutiliza o produto existente com o mesmo nome.

**Webhook já existe**  
Reutiliza o endpoint com a mesma URL. O signing secret só aparece na criação — se perdeste, apaga o webhook no [Stripe Dashboard](https://dashboard.stripe.com/webhooks) e volta a correr o script.

**Pacote stripe não encontrado**  
Corre `npm install` dentro de `scripts/`.

## Testes de webhooks

```bash
# Smoke HTTP (assinatura inválida — confirma que o endpoint responde)
npm run test:webhooks

# Eventos reais (Stripe CLI + backend local)
stripe listen --forward-to localhost:8000/runtime/judge/stripe/webhook
bash test-webhooks.sh
```

## Testes de carga (k6)

```bash
k6 run -e API_URL=http://127.0.0.1:8000 -e JUDGE_USER_ID=seu-user-id load-test-stripe.js
```

## Testes automatizados no monorepo

| Suite | Comando |
|-------|---------|
| Backend Stripe | `cd services/api && python -m pytest tests/stripe/ -q` |
| Frontend | `cd frontend/runtime_console_v3 && npm test` |
| Playwright E2E | `STRIPE_E2E=1 npx playwright test e2e/stripe-checkout.spec.ts` |
