# WALLET.md

Wallet supports ledger types:

`cashback | credit | gift_card | refund | balance | store_credit`

Tables: `wallets`, `wallet_ledgers`.  

**Explicit non-goal P1:** do not alter checkout / PIX / Stripe payment paths.  
API: `GET /runtime/judge/identity/wallets/me` returns balances (often zero).
