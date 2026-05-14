# Continuous Evaluation Platform

## Componentes

| Peça | Localização |
|------|-------------|
| Suite canónica | `services/api/evaluation/canonical_suite/**` (stubs JSON por domínio). |
| Golden human | `services/api/evaluation/golden_human_answers/` (`schema.json`, samples). |
| Motor contínuo (API) | `app/evaluation/continuous_eval/engine.py` + `app/evaluation/continuous/runtime.py`. |
| Gates CI | `pytest -m judge_grade`, job `judge_grade_gates` no GitHub Actions. |
| E2E | `tests/e2e/*` + `infra/ci/RUN_E2E_LOCAL.md`. |

## Métricas-alvo

- Legality / timing / determinismo / drift / cross-version / cross-TCG (ver métricas em `app/evaluation/*`).

## Calibração (roadmap)

- `judge confidence`, `legality calibration`: usar `golden_human_answers` + feedback persistente (`retrieval_feedback`).

## Gaps

- Pipelines noturnos ainda `stub` sem orquestração central (Airflow/Prefect).

## Riscos de drift

- Sem reavaliação contínua, mudanças de modelo LLM degradam respostas sem alarme.

## Próximos passos

1. Importar `golden_human_answers` para Postgres (tabela dedicada).
2. Ligar `run_continuous_evaluation_nightly` a um worker com `CONTINUOUS_EVAL_NIGHTLY=true`.
