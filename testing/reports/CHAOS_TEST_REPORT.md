# CHAOS_TEST_REPORT

**Gerado:** 2026-07-22T02:56:30Z  
**Verdict:** LIGHT ONLY · **NOT PASS** para critério READY

## Executado
| Case | Result |
|------|--------|
| Vitest `chaos.light.test.ts` (4) | PASS — Redis unavailable outbox accumulate + catch-up 0 losses (unit) |

## Não executado (obrigatório)
| Desligar | Status |
|----------|--------|
| Redis (runtime) | SKIPPED |
| Worker | SKIPPED |
| Gateway (Stripe/MP/ME) | SKIPPED |
| Search | SKIPPED |

Sem evidência de recuperação em ambiente real com processos mortos.

**READY chaos = NO**
