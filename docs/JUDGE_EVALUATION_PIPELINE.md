# Judge Evaluation Pipeline (Wave 2A)

## Fluxo CI

1. `scripts/ci/check_corpus_readiness.py` — consulta `GET /runtime/judge/{game_slug}/status`
2. Exporta `EVAL_SKIP_GAMES` para jogos em re-ingestão
3. `scripts/ci/run_judge_eval.py` — avalia fixtures ou API live
4. Gates: accuracy@1 não cai >5% vs `tests/judge_quality/baseline.json`; confidence_avg ≥ 0.55
5. Workflow `.github/workflows/judge-evaluation.yml` comenta no PR e atualiza baseline em `main`

## Métricas

- **accuracy@1**: top1 menciona rule_atom esperado
- **confidence_avg**: média do campo confidence
- **source_coverage**: % casos com fontes retornadas
