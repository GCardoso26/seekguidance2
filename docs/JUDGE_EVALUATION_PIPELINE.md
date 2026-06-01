# Judge — Pipeline de avaliação (CI)

## Workflow

`.github/workflows/judge-evaluation.yml` dispara em PRs que alteram `retrieval/`, `judge/`, `rag_orchestrator.py`, `config.py`, `judge_prompts/`, `runtime_judge_semantic_cache/`, `ingestion/`.

## Execução local

```bash
cd services/api
python ../../scripts/run_judge_evaluation.py
```

## Métricas

Por `game_slug`:

- **accuracy@1** — regra esperada no top1
- **confidence_avg** — confiança média simulada/fixture
- **source_coverage** — presença de fontes

## Gates

- Queda de accuracy@1 > 5% vs `evaluation/judge_quality/baselines/main.json`
- `confidence_avg` < 0.55 para jogos indexados

Relatório PR: `evaluation/judge_quality/reports/pr_comment.md`
