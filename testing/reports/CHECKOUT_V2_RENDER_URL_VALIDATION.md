# CHECKOUT_V2_RENDER_URL_VALIDATION

**Gerado:** 2026-07-21T20:39:44Z  
**Verdict:** **FAIL — URL atual NÃO é o Render**

## O que está configurado

| Fonte | Valor |
|-------|--------|
| Vercel `CHECKOUT_V2_API_URL` | `https://checkout-v2-api.judgetcg.com.br` |
| FE local `.env.local` | idem |
| DNS desse host | Cloudflare (`104.21.15.54` / `172.67.161.184`) |

## Provas

1. API local `:8791` **DOWN**
2. `GET https://checkout-v2-api.judgetcg.com.br/health` → **502** (origem tunnel/local morta)
3. BFF `POST https://judgetcg.com.br/api/checkout-v2/cart` → **502**
4. URLs `*.onrender.com` candidatas (ex. `tcg-judge-checkout-v2.onrender.com`) → **404**
5. `https://seekguidance.onrender.com/health` → **200** mas é o **FastAPI legado**, não Checkout V2 Node

## Conclusão

O Checkout V2 **não** está passando pelo novo ambiente Render na URL em uso. Ainda aponta para Cloudflare → PC local.

## Próximo passo (ops)

1. No dashboard Render → Web Service Checkout V2 → copiar URL `https://xxxx.onrender.com`
2. Atualizar Vercel + `.env.local`: `CHECKOUT_V2_API_URL=<essa URL>`
3. (Opcional) apontar `checkout-v2-api.judgetcg.com.br` CNAME para o Render / Cloudflare origin
4. Revalidar: health 200 + cart 401 + E2E

