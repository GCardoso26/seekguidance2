# Plataforma de execução formal (TCG Judge API)

## Resumo

Foi adicionada uma camada de **IR formal de regras**, **pipeline de compilação**, **runtime de simulação determinística** (reasoning-only), **sandbox com caps**, **motor de mutações**, **composição semântica**, **hooks de verificação**, **métricas de avaliação**, **núcleo semântico cross-TCG**, **cache de IR versionado**, **parser V3**, **Explainability V7** (`reasoning_v7`), e **canonical suite V5** (stubs).

Objetivo: **raciocínio judge-grade formalizado**, não motor jogável nem servidor multiplayer.

## Formal Rule IR (`app/rules/ir/`)

- `RuleIRDocument`: condições, janelas de timing, precedência, mutações, efeitos contínuos, dependências, requisitos de estado, eventos gerados, metadados, `ir_version`.
- Builder a partir de `StructuredRule`, serialização determinística JSON.

## Pipeline de compilação (`app/rules/compiler/`)

Fluxo: `StructuredRule` → lowering semântico → expansão de dependências (limitada) → expansão/corte de mutações → lowering de constraints → otimização determinística → validação estática.

## Cache IR (`app/rules/ir_cache.py`)

- `IRCompilerCache`: chave estável por conteúdo da regra + versão de schema; invalidação por `rule_id` ou `invalidate_all`.
- Evita recompilar o mesmo dicionário estruturado de forma redundante.

## Runtime (`app/runtime/`)

- `RuntimeScheduler` + `scheduler/`: ordenação estável de roles, precedência opcional, janelas de prioridade por jogo (stub).
- `SimulationRuntime`: fila limitada, passos limitados, eventos de sandbox.
- `sandbox/`: `ExecutionLimits`, `RecursionGuard`, limites de mutação, `RuntimeCaps`.
- `mutations/`: `MutationEngine`, validação, conflitos, histórico, mutadores simbólicos.

## Composição e verificação

- `app/rules/composition/`: fusão de dependências/precedência, merge de contínuos, overrides, validação.
- `app/verification/`: asserções de legalidade, invariantes, provas placeholder, verificação de log de mutações.

## Cross-TCG (`app/games/semantic_core/`)

Literais de forma (`stack_based`, `chain_reverse`, etc.) para reduzir acoplamento a um único TCG.

## Explainability V7

- Tipo `FormalRuntimeResolutionV7` em `app/reasoning/types.py`.
- Pipeline `run_formal_runtime_v7` em `app/reasoning/formal_runtime_v7_pipeline.py`, invocado após V6 em `app/reasoning/engine.py`.
- API: campo **`reasoning_v7`** em `ChatResponse` (`app/schemas/chat.py`) preenchido em `rag_orchestrator.py`.
- Payload espelha o formato pedido: `compiled_ir`, `runtime_execution_order`, `formal_mutations`, `deterministic_replay_hash`, etc.

**Nota:** O hash de replay usa apenas ordem, mutações formais e IDs compilados (evita divergência por metadados voláteis de cache).

## Parser V3 (`app/rules/rule_parser_v3.py`)

Extende V2 com hints de mutações, scopes, triggers, eventos e asserções; integrado em `rule_parser.py`.

## Canonical suite V5 (`evaluation/canonical_suite/`)

Novos grupos (stubs JSON): `runtime_consistency_cases`, `deterministic_replay_cases`, `mutation_conflict_cases`, `runtime_overflow_cases`, `recursion_guard_cases`, `continuous_effect_storms`, `chain_explosion_cases`, `invariant_violation_cases`, `semantic_override_cases`.

## Testes

- `tests/runtime/`: 9 ficheiros de teste (incl. replay determinístico).
- E2E: `tests/e2e/test_judge_questions.py` estendido com 5 perguntas V7 e asserções de `reasoning_v7`.

## Testes executados

- `python -m ruff check app tests`
- `python -m pytest` (98 passed, 12 skipped no ambiente local)

## Gaps e próximos passos

1. Integração mais profunda entre **parser V3** e campos explícitos no IR (mutações tipadas por schema).
2. **SAT / solvers**: ligar `verification/constraint_proofs.py` a um backend real.
3. **Distributed runtime**: hoje as sessões são in-process; escalonar exigiria fila externa e snapshot serializável completo.
4. **Canonical suite V5**: substituir stubs por casos executáveis contra `run_formal_runtime_v7`.
5. **Stress/adversarial**: suite dedicada com grafos grandes e caps agressivos.

## Problemas corrigidos durante a implementação

- **Import circular** `reasoning` ↔ `evaluation`: métrica de convergência foi inlined no pipeline V7 em vez de importar `app.evaluation` (que puxa benchmark → `run_reasoning_engine`).
