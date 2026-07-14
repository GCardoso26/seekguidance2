# Final Smoke Report — RC1

**Data:** 2026-07-14  
**BASE:** `https://judgetcg.com.br`  
**Harness:** `python scripts/smoke_test.py`

## Resultado

```
RESULTADO: 34 passaram, 0 falharam
```

Exit **0**.

## Cobertura (amostra)

- Catalog Health / Image Coverage  
- BFF Health  
- Homepage / Landing marketplace  
- Perfil · Search · Loja · Game Hub  
- Checkout · Marketplace checkout  
- Vendedor painel + redirects `/store`  
- Leaderboard · Decks · Gamification · Analytics  

## Health

| Endpoint | Status |
|---|---|
| `https://judgetcg.com.br/api/health` | 200 |
| `https://seekguidance.onrender.com/health` | 200 |
| `https://seekguidance.onrender.com/runtime/judge/health` | 200 |
