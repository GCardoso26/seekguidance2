# Runtime validation (CI)

- Verificar flags AWS opcionais não ligadas em staging sem credenciais.
- `python -m ruff check app tests evaluation` + `pytest -q` (gates existentes).

Deterministic runtime validation: usar testes já existentes de replay/solver stubs.
