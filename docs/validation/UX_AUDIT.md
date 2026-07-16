# UX_AUDIT.md

## Cross-cutting questions

| Question | Answer (audit) |
|----------|----------------|
| Should every button exist? | No — dual finance entries, Smart Cart goals always open, redundant /login CTAs |
| Intuitive flows? | Auth + cart breaks intuition |
| Extra steps? | Browse legacy hops; Smart Cart goals |
| Excess clicks? | Mobile Loja vs Comprador ambiguity (UX-01) |
| Duplication? | Dual wallet APIs/UI; dual finance seller |
| Inspires trust? | No — zeros wallet + open financial API risk |
| Shopify/Stripe/ML/Cardmarket? | Auth funnel worse; money trust worse; catalog intent closer to Cardmarket |

## Persona UX highlights

- **New buyer:** Auth dead-ends kill first purchase.  
- **Recurring:** Cart drawer missing on card pages frustrates.  
- **Seller:** Feature appear unlocked then forbidden.  
- **Judge:** Screens exist; uncertainty who can press “Generate pairings”.  
- **Admin sandbox:** Too easy to believe elevation is intentional when misconfigured.

## Priority UX fixes (after security)

BUY-001/002 → BUY-003/004 → FIN-03 labeling → UX-01 mobile labels → Smart Cart collapse.
