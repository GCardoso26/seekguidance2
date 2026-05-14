# Constraint validation + deterministic resolution

## Objetivo

Complementar o motor de raciocínio com:

- **constraints declarativos** por jogo (`app/games/*/constraint_rules.py`);
- **propagação bounded** de efeitos simbólicos (`constraints/propagation.py`);
- **deteção de contradições** (ordem ilegal, timing, mutex, ciclos) (`contradictions/`);
- **resolução determinística** via ordenação topológica com desempate lexicográfico (`deterministic/precedence_resolver.py`);
- **validação formal** (`chain_validator.py` → `validate_formal_chain`);
- **Explainability v4** em `ReasoningReportV3.constraint_resolution`, espelhada na API como `reasoning_v4`.

## Fluxo (engine)

1. `plan_execution` gera passos com `role` semântico.
2. `solve_deterministic` expande papéis implícitos (ex.: `event` quando há `replacement`/`sba` em MTG), filtra `must_precede` e aplica topo-sort determinístico.
3. `validate_formal_chain` + `detect_contradictions` avaliam a cadeia final.
4. `run_constraint_engine` produz grafo formal + `propagation_chain`.
5. A simulação respeita `allowed_roles` quando a resolução foi bem-sucedida.

## API

- `ChatResponse.reasoning_v4`: mesmo payload que `constraint_resolution` (validação, cadeia validada, rejeitados, propagação).
- `ChatResponse.reasoning_v3` mantém `constraint_resolution` aninhado para compatibilidade.

## Limites

- `Settings.constraint_max_propagation_cap` (48) — clamp na prática via `MAX_PROPAGATION_STEPS` por jogo.
- Sem emulador de mesa: apenas validação simbólica sob `must_precede` / `timing_requires` / `mutex`.

## Datasets adversariais

`datasets/adversarial/**` — schema com `valid_chain`, `invalid_chains`, `constraint_expectations`, `timing_requirements`.

## Avaliação V2 (métricas)

- `app/evaluation/constraint_accuracy.py`
- `app/evaluation/deterministic_validation_metrics.py`
- `app/evaluation/contradiction_detection_metrics.py`
- `app/evaluation/chain_legality_metrics.py`

## Gaps

- `reasoning_timeout_ms` ainda não aplicado com `asyncio.wait_for` no motor.
- Constraints são **declarativas e reduzidas**; não cobrem o CR integral.
- Golden adversarial scoring automático ainda não ligado ao runner de benchmark.
