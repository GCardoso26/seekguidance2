# Judge-Grade Production Readiness

Este documento consolida a fase **Judge-Grade Production Readiness**: confiabilidade, operacionalização, validação contínua, correctness incremental, UX de juiz e escala — **sem remover** pipelines **V1–V11**, **sem alterar** payloads `reasoning_v1` … `reasoning_v11`, e **sem simplificar** motores de reasoning ou explainability.

## Arquitetura (incremental)

| Área | Entrega nesta sprint | Notas |
|------|----------------------|--------|
| **Corpus** | Pacote `tcg_judge_ingestion.corpus/*` (expansion, acquisition, archival, lineage, provenance, trust_scoring, semantic_alignment, historical_archive, métricas) | Pipelines declarativos; URLs reais continuam em `crawler` / `sources_registry`. |
| **Trust** | `tcg_judge_ingestion/trust/` (`source_trust`, `semantic_confidence`, `provenance_score`, `citation_strength`) + agregador em `corpus/trust_scoring/aggregate.py` | Heurístico; calibrar com dados reais e `CORPUS_TRUST_FLOOR`. |
| **Parsers** | `parsers/deep_semantics.py` + enriquecimento via `registry.extract_for_game` | Emite `structured_rule_draft_v5` (dict compatível com `structured_rule_from_dict` na API). |
| **Formal correctness** | `app/verification/formal_solver/` (IR, compiler, SAT hooks mínimos, stub SMT) | Backend `FORMAL_SOLVER_BACKEND=stub`; Z3/PySMT como extensão futura. |
| **Provas / replay** | `formal_proofs/*`, `runtime/replay/formal_certification.py`, `exhaustive_legality.py`, `timing_verification/*` | Certificação agrega `validate_replay` + metadados de prova. |
| **Avaliação contínua** | `app/evaluation/continuous_eval/engine.py`, `golden_answers/*` | Orquestra métricas de replay + verificação formal stub; nightly opcional (`CONTINUOUS_EVAL_NIGHTLY`). |
| **Métricas replay** | `replay_determinism_score` em `deterministic_replay_metrics.py` | Usa `validate_replay` existente. |
| **Observabilidade** | `app/observability/otel_spans.py` | Atributos de span; export OTEL continua opcional via settings. |
| **Segurança** | `app/security/replay_integrity.py` + `REPLAY_SIGNING_SECRET` | HMAC canónico JSON; opt-in. |
| **Cache** | `app/cache/semantic_redis_cache.py` | Fallback in-memory; Redis real em fase seguinte. |
| **ANN / HNSW** | `app/retrieval/hnsw_ops.py` | Plano de rebuild + lineage stub. |
| **Workers** | `services/workers/gpu_inference_hooks.py` | Descritor de jobs GPU (fila real depois). |
| **Infra** | `infra/metrics/*`, `infra/ci/README.md`, runbook DR | Complementa `infra/observability`. |
| **UX** | `apps/explainability/`, `apps/judge_replay/replay.html` (scrubber + mobile-friendly) | Apps estáticas; sem mudança de contrato API. |

## Modelo de correctness

1. **IR formal** (`constraint_ir.FormalIR`): variáveis e constraints serializáveis.
2. **Compilação** (`compiler.compile_legality_ir` / `compile_timing_ir`): flags → IR.
3. **Solver stub** (`solve_stub`): deteta contradições explícitas; SAT trivial.
4. **Exaustão limitada** (`timing_verification.exhaustion.bounded_orderings`): ordens de eventos pequenos.
5. **Conflitos de flags** (`exhaustive_legality.detect_flag_contradictions`): pares `x` / `not_x`.
6. **Replay** (`formal_certification.certify_payload`): determinismo via hashing repetido.

**Gaps honestos:** sem Z3/PySMT ligado; sem provas completas de SEGOC/SBA/replacement loops; exaustão é limitada; trust scores não validados contra corpus real massivo.

## Corpus

- **Expansão contínua:** `default_expansion_intents()` lista tipos de fonte (rulings, CR, errata, policy, fóruns, FAQ, bulletins, replays, relatórios, snapshots).
- **Arquivo / time-travel:** `historical_archive/snapshots.py` (stubs de reconstrução e ordenação de versões).
- **Qualidade:** `corpus_quality_dashboard` (cobertura por TCG, freshness, stub de cobertura semântica).

## Estratégia de avaliação

- **CI:** `pytest -q -m "not integration and not e2e"` + job **`judge_grade_gates`** (`pytest -m judge_grade`).
- **Bundle local:** `run_judge_grade_eval_bundle()` combina score de determinismo de replay + verificação formal stub.
- **Golden answers:** `golden_answers/store.py` + stubs `expert_validation` / `judge_review` para workflows futuros.

## Testes E2E (stack real)

- **Marcador:** `pytest -m e2e` (ficheiros em `services/api/tests/e2e/`).
- **Ativar:** `RUN_E2E=1`. Opcional: `E2E_API_BASE` (default `http://127.0.0.1:8000`), `E2E_USE_COMPOSE_REDIS=1` e `E2E_REDIS_URL` para alinhar ao `docker-compose` (Redis no host em `6380`).
- **Guard:** `tests/e2e/conftest.py` verifica `GET /v1/health` e `GET /v1/games` uma vez por sessão; se a API ou Postgres não estiverem disponíveis, todos os e2e são *skipped* com mensagem explícita (evita múltiplos timeouts).
- **Cobertura:** `test_judge_questions.py` (matriz de perguntas e contratos `reasoning_v3`–`reasoning_v11` quando presentes); `test_api_surface_e2e.py` (raiz, OpenAPI, smoke `POST /v1/chat/ask`).
- **Como correr:** `infra/ci/RUN_E2E_LOCAL.md`.

## Infra

- Métricas: ver `infra/metrics/README.md` e `alerting_rules_stub.yml` (expr placeholder até métricas reais).
- DR: `infra/disaster_recovery/REPLAY_VECTOR_GRAPH_RUNBOOK.md`.

## UX

- **Explainability:** shell em `apps/explainability/`.
- **Replay:** scrubber, play/pause, rollback, viewport meta — preparado para ligação à API.

## Métricas sugeridas (próximos passos)

- Cobertura de corpus por TCG e por tipo de fonte.
- `replay_determinism_score` agregado (p50/p95) + taxa de falhas de certificação.
- Latência formal solver (quando Z3 estiver ligado).
- Drift semântico (já existente em `app.verification.drift`).

## Riscos

- **Falso conforto** com solver stub (SAT/SMT real necessário para juiz-grade forte).
- **Trust heurístico** sem rotulagem humana / golden sets.
- **UX estática** sem dados ao vivo pode subutilizar capacidades do motor.

## Próximos passos (prioridade)

1. Ligar `formal_solver` a Z3 ou PySMT mantendo o mesmo `FormalIR`.
2. Persistir golden answers + revisão de juízes (Postgres).
3. Implementar Redis real em `semantic_redis_cache` com TTLs dos settings.
4. Pipelines de ingestão contínua por tipo (`acquisition/pipelines` → workers).
5. Export Prometheus completo para replay/ingestão/reasoning (exprs reais nas alertas).

---

*Última atualização: sprint Judge-Grade Production Readiness (incremental, compatível com V1–V11); inclui guard E2E e documentação `infra/ci/RUN_E2E_LOCAL.md`.*
