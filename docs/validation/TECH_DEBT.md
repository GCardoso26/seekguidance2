# TECH_DEBT.md

Structural debt from Product Validation 4.5 (not exhaustive codebase debt).

**Plataforma / arquitetura / ops (débitos aceitos com critério de remoção):** ver [`docs/architecture/TECHNICAL_DEBT_REGISTER.md`](../architecture/TECHNICAL_DEBT_REGISTER.md) e a [`PLATFORM_CONSTITUTION.md`](../architecture/PLATFORM_CONSTITUTION.md).

| Debt | Why it hurts | Related IDs |
|------|--------------|-------------|
| Dual auth entrypoints `/login` vs `/entrar` | Conversion + support load | BUY-001 |
| Dual wallet / financial façades | Impossible single cash story | FIN-01 |
| Dual finance seller UIs | Seller confusion | FIN-02 |
| Dual-read RBAC incomplete for events | Permissions lie | RBAC-002/004 |
| Soft-open permission pattern | Security debt pattern | RBAC-001 |
| Analytics emit → logger | Fake observability | ANA-01 |
| Typed events without emitters | Registry inflation | ANA-04 |
| FacetedSearch client monolith | Perf | PERF-02 |
| Store-only CartProvider | Incomplete commerce shell | BUY-004 |
| Sandbox fail-open client | Elevates on outage | SEL-002 |
| Docs overclaim wiring | False RC confidence | JUD-002, ANA-05 |
| Refresh token no body + sessionStorage | XSS pode roubar refresh até cookie HttpOnly | SECURITY-001 |

## Paydown order

Security soft-open + financial RBAC → **SECURITY-001 HttpOnly refresh** → auth URL unification → analytics persistence → shell CartProvider → dual wallet cutover design → docs honesty.

Ver também: [`docs/frontend/FRONTEND_HARDENING.md`](../frontend/FRONTEND_HARDENING.md).
