# Lighthouse RC Final

**Data:** 2026-07-14  
**Lab BASE:** `http://localhost:3000` · **Prod BASE:** `https://judgetcg.com.br`  
**Preset:** desktop

## Lab (após fixes checkout/busca)

| Rota | Perf | A11y | BP | SEO | LCP | CLS |
|---|---:|---:|---:|---:|---|---|
| `/` | 99 | 100 | 100 | 100 | 0.8s | 0.045 |
| `/loja` | 100 | 100 | 100 | 100 | 0.7s | 0.045 |
| `/loja/busca` | **95** | 100 | 100 | 100 | 1.5s | 0.045 |
| `/checkout` | **98** | 100 | 100 | 100 | 1.2s | 0 |
| cart | 97 | 100 | 100 | 100 | 1.3s | 0 |
| comprador | 97 | 100 | 100 | 100 | 1.2s | 0 |
| vendedor | 99 | 100 | 100 | 100 | 1.0s | 0 |
| decks | 97 | 100 | 100 | 100 | 1.2s | 0 |

Fonte: `lighthouse-reports/rc1-final-lab.json` · **ALL_GATES_PASS_LAB**

## Produção (bateria independente + triples busca)

### Bateria completa (1 run)

| Rota | Perf | A11y | BP | SEO | LCP |
|---|---:|---:|---:|---:|---|
| `/` | 96 | 100 | 100 | 100 | 1.0s |
| `/loja` | 100 | 100 | 100 | 100 | 0.6s |
| **/loja/busca** | **92** | 100 | 100 | 100 | 1.3s |
| `/checkout` | **99** | 100 | 100 | 100 | **0.9s** |
| cart | 99 | 100 | 100 | 100 | 0.9s |
| comprador | 99 | 100 | 100 | 100 | 0.9s |
| vendedor | 100 | 100 | 100 | 100 | 0.7s |
| decks | 98 | 100 | 100 | 100 | 1.0s |

### `/loja/busca` estabilidade (pós deploy lazy header)

| Run | Perf | LCP | SI |
|---:|---:|---|---|
| 1 (cold) | **80** | 2.2s | 2.9s |
| 2 | 95 | 1.5s | 1.0s |
| 3 | 97 | 1.2s | 0.8s |

**Min 80 &lt; 95** → gate de estabilidade **FAIL**.

## Antes → Depois blockers

| Rota | Antes | Depois (melhor run) | Estável? |
|---|---|---|---|
| checkout | 91 / 2.0s | **99 / 0.9s** | **sim** |
| busca | 86 / 2.1s | 97 / 1.2s (warm) | **não** (cold 80) |
