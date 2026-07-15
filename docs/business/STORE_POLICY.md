# STORE_POLICY.md

`StorePaymentPolicy` decides accepted methods **per inventory type**.

| Type | Default methods |
|---|---|
| PRODUCT | PIX, Stripe, Counter |
| EVENT | PIX, Stripe, Wallet |
| SERVICE | PIX, Stripe |
| DIGITAL | PIX, Stripe, Wallet |
| GIFT_CARD | PIX, Stripe, Wallet |

Table: `store_payment_policies`. Defaults applied in `StorePolicyService` if rows missing.  
**Checkout is not changed** in Program 1 — policies are architectural only.
