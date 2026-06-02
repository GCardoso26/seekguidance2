# NPM Audit Baseline — Wave 2C

Data: 2026-06-01  
Projeto: `frontend/runtime_console_v3`  
Next.js: **14.2.35**

## Resumo

| Severidade | Count |
|------------|-------|
| Critical | 1 |
| High | 1 |
| Moderate | 5 |
| **Total** | **7** |

## Pacotes afectados

### next (high)
- Múltiplos advisories DoS/XSS/cache (GHSA-*)
- Fix sugerido pelo npm: `next@16.2.7` (breaking)

### esbuild / vite / vitest (moderate, dev)
- GHSA-67mh-4wv8-2f99 — dev server only
- Fix: vitest@4.x (breaking)

### postcss (moderate)
- Via dependência do next
- GHSA-qx2v-qp2m-jg93

## Plano Wave 2C Epic 2

1. Upgrade incremental **14 → 15** (não saltar directo para 16)
2. Correr `npm run lint`, `npm run test`, `npm run build`
3. Validar rewrites `/api/proxy`, CSP, auth cookies, SSE Judge
4. Documentar em `NEXTJS15_MIGRATION_REPORT.md`

## Comando baseline

```bash
cd frontend/runtime_console_v3
npm audit
```
