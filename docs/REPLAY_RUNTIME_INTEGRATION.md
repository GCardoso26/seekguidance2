# Integração operacional de replay runtime

## Componentes

- Contratos Python: `app/contracts/` (Pydantic) alinhados às rotas `app/api/v1/replay_runtime.py`.
- Governança executável: `app/runtime/replay_governance_v2/executable_replay_governance.py`.
- Ponte de execução: `evaluation/runtime_execution/runtime_execution_bridge.py`.

## Princípios

- Respostas incluem `replay_request_id`, `replay_governance_scores` e `payload` nested — clientes móveis devem persistir IDs para correlação.
- Reasoning_v1…v11 permanecem inalterados; endpoints são operacionais.
