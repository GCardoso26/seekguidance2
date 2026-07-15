# BUSINESS_MODEL.md — JudgeTCG Multi-Organization Model

**Program:** Business Program 1  
**Status:** Architecture shipped (additive, RC1-compatible)

## From marketplace account types to organizations

| Legacy (RC1 language) | New model |
|---|---|
| “Usuário comum” / buyer | `User` + default role `BUYER` (no type flag) |
| “Lojista” | `User` + `Membership(SELLER_*)` on a `Store` owned by a `Company` |

## Core graph

```
User ──< Membership >── Store ──> Company
              │
              └── Role ──> Permission set
Subscription attaches to User | Company | Store (independent of role)
Wallet attaches to User | Company | Store (not wired to checkout yet)
```

## Bounded contexts

1. **User Identity** — person, CPF, consents, MFA/passkey structure  
2. **Company** — CNPJ legal entity, KYC case, trust  
3. **Store** — brandfront of Company (1..N)  
4. **Membership / RBAC** — invite → accept → dashboard via permissions  
5. **Subscription** — commercial plan, decoupled from role  
6. **Wallet / Trust / KYC / Consent / Store Policy** — prepared engines  

## Compatibility

RC1 continues to use `player_profiles`, `stores.owner_id`, `store_user_roles`, `seller_rbac`.  
New APIs live under `/runtime/judge/identity/*`. Dual-write behind `IDENTITY_DUAL_WRITE`.
