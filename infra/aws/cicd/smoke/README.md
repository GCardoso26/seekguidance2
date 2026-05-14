# Smoke (pós-deploy)

```bash
curl -fsS "https://API_HOST/" | jq .
curl -fsS "https://API_HOST/docs" >/dev/null
pytest -q -m smoke --tb=line
```

Replay consistency checks: roadmap `pytest -m replay_governance`.
