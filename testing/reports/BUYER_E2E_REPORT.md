# BUYER_E2E_REPORT

**Carlos** · **2026-07-21T18:36:00Z** · Confidence **72%** · Meta ≥95% **NOT MET**

```text
carlos-buyer-stub → pass (72%)
tunnel auth+cart 201
Vercel BFF checkout → 502 (bloqueia comprador em produção)
```

Não cobertos: login ciclo full, filtros/paginação, cupons UI, frete no checkout UI, pay capturado, pedido/cancelar/avaliar.

**Bloqueio:** BUG-0010 + sem listing ativo para E2E pagamento.
