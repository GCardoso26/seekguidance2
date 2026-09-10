# FINANCIAL_PLATFORM.md

**Program:** Business Program 3  
**Package:** `services/api/app/financial_platform/`  
**Status:** Additive over RC1 payments / BP1 wallets / escrow

## Principle

All future money movement should route through Financial Platform. Day-1: dual-read + new `fin_*` ledgers; Checkout/Stripe/PIX unchanged.

## Stack

Ledger (double-entry) → Wallet → Escrow → Split → Settlement → Payout → Credits/Cashback/Gift → Analytics

Perguntas da apresentação a desenvolvedores (Liga/MyP, por que gateway de loja não faz escrow de marketplace): [`MARKETPLACE_PSP_ESCROW.md`](./MARKETPLACE_PSP_ESCROW.md).
