# Registro, CPF e KYC Lojista

## Jogador

1. Registro via **Google OAuth** ou **e-mail/senha** (`/entrar`)
2. Redirect → `/completar-perfil` (CPF obrigatório)
3. Validação CPF (algoritmo + lookup opcional `CPF_LOOKUP_URL`)
4. `account_status = active` → pode comprar

### Status jogador

| Status | Significado |
|--------|-------------|
| `pending_cpf` | CPF não validado — navega, não compra |
| `active` | CPF validado |
| `suspended` | Conta suspensa |

### Anti-duplicação

- `cpf_hash` UNIQUE — CPF duplicado → 409 + mensagem de recuperação
- CPF nunca armazenado em texto claro (SHA-256)

## Lojista

1. Conta base igual ao jogador (CPF obrigatório)
2. Painel → **Tornar-se lojista** → `merchant_profiles.kyc_status = pending`
3. Redirect Stripe Connect onboarding
4. Webhook `account.updated` → `verified` | `rejected` | `restricted`

### Gates

- **Comprar** (checkout/PIX): `account_status = active`
- **Publicar** (produtos/listagens): `merchant kyc_status = verified`

## Migration

```bash
supabase db push
# ou apply: supabase/migrations/20260701120000_account_kyc_registration.sql
```

## Env vars

| Variável | Uso |
|----------|-----|
| `CPF_LOOKUP_URL` | Opcional — URL com `{cpf}` para validação externa |
| `STRIPE_WEBHOOK_SECRET` | Webhooks incl. `account.updated` (Connect) |

## API

- `GET /runtime/judge/account/status`
- `POST /runtime/judge/account/cpf` `{ "cpf": "..." }`
- `POST /runtime/judge/merchant/onboarding` `{ "store_id": "..." }`

## UI

- `/completar-perfil` — CPF pós-registro
- Banner global — CPF pendente
- Modal checkout — bloqueio sem CPF
- Card KYC — painel lojista
