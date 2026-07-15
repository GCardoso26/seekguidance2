# TRUST_ENGINE.md

Scores **0–100**.

## Store Trust factors (architecture)

Orders, chargebacks, events, reviews, response time, cancellations, KYC, delivery, judges, NPS.

## Buyer Trust

Purchases, chargebacks, disputes, events, payments, history — **computed but not displayed** (`display: false`).

## Implementation P1

`TrustService` reads snapshots; bridges `reputations.trust_score` when available; otherwise baseline 50.
