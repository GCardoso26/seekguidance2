# Stripe Connect Report — Stabilization

**Bug:** PDV-BUG-003 (P0)  
**Data:** 2026-07-22

## SDK

- Stripe Python SDK 15+: **sem** `Account.get`.
- Refresh usa `stripe.Account.retrieve` e/ou `client.v2.core.accounts.retrieve`.
- Helpers: `_stripe_account_flag`, `_stripe_account_as_dict`, `_v2_account_ready`.

## Multi-loja

`get_owner_store` e `list_owner_stores` alinhados a `resolve_owner_store`:

1. `shop_enabled`
2. plano (enterprise → pro → lojista → free)
3. `created_at DESC`

FE: `useSellerStore` prefere loja do dashboard (já em main).

## Evidências

| Teste | Resultado |
| --- | --- |
| `tests/marketplace/test_stripe_connect_sdk15.py` | **6 passed** |
| Source sem `Account.get(` | PASS (assert) |
| `POST .../connect/refresh/{storeId}` sem auth | **401** (endpoint vivo; não 500) |
| Refresh autenticado + `stripe_onboarding_complete` | **NÃO COMPROVADO** |
| Checkout cartão pós-refresh | **NÃO COMPROVADO** |

## OAuth / onboarding

Fluxo de criação de link (`create_account_onboarding_link` / V2) **não reexecutado** com conta real nesta sprint — sem alteração de regras; apenas alinhamento de store + regressão SDK.

## Conclusão

Código Connect compatível com SDK 15 e seleção de loja alinhada.  
**Pronto para revalidação autenticada em produção.** Não declarar checkout Connect “OK em prod” sem essa sessão.
