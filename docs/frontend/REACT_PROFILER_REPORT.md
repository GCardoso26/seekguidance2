# React Profiler Report — Sprint 19

**Data:** 2026-07-13  
**Método:** auditoria estática + Lighthouse TBT (Chrome Profiler DevTools não anexado a esta sessão CI)

## Achados

| Área | Problema | Ação |
|---|---|---|
| Home monólito client | Hydration grande | RSC + islands |
| Provider tree root | Context fan-out | Decomposto |
| Buyer skeleton | Altura ínfima vs content | min-h + grade espelhada |
| Command palette | cmdk no boot | dynamic + open-only |
| Upgrade modal | throw fora do provider | no-op seguro |

## Memo

Sem memo/useCallback em massa (evitar over-memoization). React Compiler guidance do repo respeitada.

## Follow-up

Gravar Profiler Chrome em staging pós-deploy (export JSON) para validar renders de `GlobalHeader` sob navegação marketplace.
