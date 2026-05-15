# Alinhamento OpenAPI ↔ TypeScript

## Fontes

- Contratos Python: `app/contracts/`.
- Matriz de rotas: `apps/mobile/shared_contracts/openapi_alignment/route_contract_matrix.json`.
- Exemplos JSON: `apps/mobile/shared_contracts/openapi_alignment/payload_examples/`.

## Fluxo recomendado

1. Gerar `openapi.json` a partir do FastAPI.
2. Diff estrutural com exemplos e matriz.
3. Atualizar `typescript_contracts/` quando campos estáveis mudarem.

Sem geração automática de SDK nesta fase.
