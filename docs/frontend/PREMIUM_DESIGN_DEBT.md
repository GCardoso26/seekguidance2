# Premium Design Debt

**Atualizado:** 2026-07-10

## Bloqueadores para 9.5

| ID | Item | Severidade | Esforço |
|----|------|------------|---------|
| PD-01 | Purge `text-white` / `bg-black/` / `border-white/` | P0 | L |
| PD-02 | Purge `luxury-*` em produto (exceto `components/luxury`) | P0 | L |
| PD-03 | Migrar `text-xs`/`text-sm` → tokens | P0 | L |
| PD-04 | Judge portal theme-safe | P0 | M |
| PD-05 | Finance tables + chart tokens | P1 | M |
| PD-06 | Inputs painel `surface-card` → `Input` | P1 | M |
| PD-07 | Chrome triplo SellerHeader | P1 | S |
| PD-08 | Unificar DataTables | P1 | M |
| PD-09 | `ds:audit` como gate CI (fail) | P1 | S |
| PD-10 | Ban `text-[Npx]` eslint error | P1 | S |

## Medição

```bash
cd frontend/runtime_console_v3 && npm run ds:audit
```

Relatório: `lighthouse-reports/ds-audit.json`

## Pago nesta sessão

- Tokens v3 + HC + info
- Motion DS + reduced-motion
- Brand layer
- Empty/Toast/PageHeader unification
- Hero único marketplace
- Store header + mobile safe-area + Stripe hsl
