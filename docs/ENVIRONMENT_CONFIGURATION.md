# Environment Configuration

Configuração de **produto** (`APP_MODE`, `ENVIRONMENT`) permanece em:

- `services/api/app/sandbox/mode.py`
- `frontend/runtime_console_v3/src/lib/app-mode.ts`
- `docs/sandbox/ADMIN_SANDBOX.md`

Configuração de **infraestrutura de testes** (local / ci / staging / beta / production):

- `testing/config/environments/`
- `docs/testing/TESTING_ARCHITECTURE.md`

**Regra:** `JUDGE_TEST_ENV=beta` ou `APP_MODE=beta|production` bloqueia seed, cleanup, Playwright e personas (`testing/guards/assert-not-beta.mjs`).
