# Operational Confidence

## API

- `app/confidence/operational.py` — `operational_confidence_bundle` agrega retrieval, grafo e replay com penalização opcional cross-TCG.

## Uso

- Pode alimentar dashboards e gates de release **sem** alterar `reasoning_v*` (camada paralela).

## Riscos

- Pesos fixos (0.35/0.35/0.3) precisam calibração (`app/evaluation/calibration/`).

## Próximos passos

1. Exportar `operational_confidence_bundle` como métrica Prometheus `tcg_ops_confidence`.
