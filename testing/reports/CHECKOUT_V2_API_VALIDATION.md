# CHECKOUT_V2_API_VALIDATION

**Gerado:** 2026-07-21T15:55:54.729Z
**Verdict:** PASS
**API:** http://127.0.0.1:8791
**FE:** http://localhost:3000

| Step | OK | Status | Detail |
|------|----|--------|--------|
| api.health | PASS | 200 | ok |
| api.cart.unauth_401 | PASS | 401 | {"error":"unauthorized"} |
| api.auth.register | PASS | 201 | userId=b3ad21eb-d446-40d3-a8c4-dcd927790c79 |
| api.auth.login | PASS | 200 | token_received |
| api.cart.create | PASS | 201 | cartId=390af4b1-479e-4778-89b1-dd5446c5112b |
| api.sessions.missing_cartId_400 | PASS | 400 | {"error":"cartId_required"} |
| bff.proxy_to_checkout_v2 | PASS | 401 | {"error":"unauthorized"} |
| ops.vercel_localhost_warning | PASS | 0 | local_ok_or_not_applicable |

## Nota Vercel

`CHECKOUT_V2_API_URL=http://127.0.0.1:8791` no Vercel **não funciona**: o BFF roda na cloud e `127.0.0.1` é o host da Vercel, não o seu PC.
Use essa URL só no **FE local** (`.env.local`), ou exponha a API Node via tunnel/host público.
