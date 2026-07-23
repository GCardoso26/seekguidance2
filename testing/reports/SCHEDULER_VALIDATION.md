# SCHEDULER_VALIDATION

**Date:** 2026-07-22  
**Result:** **FAIL**

## Code

`scheduler-tick.ts` supports `--bootstrap`, `--expansion`, `--health`, `--knowledge`.  
Jobs list includes knowledge coverage, contents/specs/collections/lifecycle/metadata sync labels.

## Production

| Metric | Value |
|--------|------:|
| provider_registry | 0 |
| sync_runs | 0 |

Sem registry, `ProviderScheduler.tick()` não enfileira providers.

## Flags knowledge/health

Não executados contra prod nesta campanha (evitado write desnecessário além da observação).

## Bugs

BUG-V4-002 (P0).
