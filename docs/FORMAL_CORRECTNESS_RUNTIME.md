# Formal Correctness Runtime

## Objetivo

Camada **lazy** e **feature-gated** para SAT/SMT, provas de replay e exaustão limitada — **sem** substituir motores simbólicos existentes.

## Arquitetura

| Módulo | Função |
|--------|--------|
| `app/verification/formal_solver/` | IR de constraints, `solve_stub`, `compile_*`, `detect_replacement_loop_hints`, `external_solver_status` / `try_import_z3` (opcional). |
| `app/verification/formal_proofs/` | Grafos de prova + certificação de replay. |
| `app/verification/exhaustive_legality.py` | Conflitos de flags. |
| `app/verification/timing_verification/` | Janelas + permutações limitadas. |
| `app/reasoning/exhaustive_validation/` | SEGOC/APNAP stubs de exploração limitada. |
| `app/reasoning/formal_response_addon.py` | Chaves **aditivas** opcionais em `reasoning_v8`–`v11` quando `REASONING_FORMAL_EXPLAINABILITY_ENABLED=true`. |

## Contratos

- Payloads `reasoning_v3`–`v7` **inalterados**.
- `reasoning_v8`–`v11`: apenas **novas chaves opcionais** (`formal_proofs`, `proof_conflicts`, `solver_trace`, `proof_constraints`, `legality_proof_path`, `timing_proof_path`) via flag; valores por defeito **ausentes** quando flag off.

## Integrações futuras

- Z3 / PySMT / cvc5 através de `external_solvers.py` (import lazy).
- Provas fortes por TCG: YGO (SEGOC), MTG (SBA/replacement), FAB (combat chain).

## Gaps

- Solver ainda majoritariamente **stub**; Z3 não empacotado por defeito.
- Exaustão real de estados é **bounded** por custo computacional.

## Riscos

- Falso positivo/negativo em heurísticas de loop de replacement.
- Latência se Z3 for ligado sem cache de IR.

## Próximos passos

1. Compilar `FormalIR` a partir de `StructuredRule` já existentes.
2. Cachear resultados de `verify_compiled` por hash de flags.
3. Expandir `exhaustive_validation` com orçamento por `reasoning_timeout_ms`.
