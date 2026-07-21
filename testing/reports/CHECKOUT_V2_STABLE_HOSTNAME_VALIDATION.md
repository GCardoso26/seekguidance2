# CHECKOUT_V2_STABLE_HOSTNAME_VALIDATION

**Gerado:** 2026-07-21T17:40:00Z  
**Tunnel hostname:** `https://checkout-v2-api.judgetcg.com.br`  
**FE:** `https://judgetcg.com.br`

| Step | Result |
|------|--------|
| tunnel.health | PASS 200 |
| tunnel.cart unauth | PASS 401 |
| tunnel register/login/cart | PASS 201 |
| vercel.bff cart | **FAIL 500** |
| PSP secrets | **FAIL MISSING** |

Verdict overall: **FAIL** (hostname OK; BFF+PSP bloqueiam READY)
