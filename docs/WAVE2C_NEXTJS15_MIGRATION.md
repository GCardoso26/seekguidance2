# Wave 2C — Next.js 15 (planeado)

O frontend está em **Next.js 15.5** + **React 19.2** (`frontend/runtime_console_v3`).

## Baseline de segurança

- [NPM_AUDIT_BASELINE.md](./NPM_AUDIT_BASELINE.md)
- [NEXTJS15_MIGRATION_REPORT.md](./NEXTJS15_MIGRATION_REPORT.md)
- [NEXTJS15_UPGRADE.md](./NEXTJS15_UPGRADE.md)

## Quando atualizar

1. `cd frontend/runtime_console_v3 && npm audit`
2. `npm install next@^15 react@^19 react-dom@^19`
3. `npm run lint && npm run test && npm run build`
4. Validar cookies HttpOnly em `/api/auth/login`, SSE em `judgeApi.ts`, `StreamingIndicator`

Critério de aceitação Wave 2C Epic 2: build verde e **zero CVEs críticas** no audit pós-upgrade.
