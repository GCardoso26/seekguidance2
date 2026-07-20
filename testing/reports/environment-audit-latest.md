# Environment Audit — Ricardo Menezes (SRE)

_Gerado em 2026-07-20T13:44:29.753Z_

| Métrica | Valor |
| --- | --- |
| Environment Score | **100%** |
| Blocking Issues | **0** |
| Warnings | 4 |
| Ready for Functional QA | **YES** |

## Checks

| Check | Status | Blocking | Detail |
| --- | --- | --- | --- |
| Environment Guard (not beta/production) | PASS | yes | resolved env=local |
| JUDGE_TEST_ENV / TEST_ENV | PASS | yes | inferred=local |
| APP_MODE | PASS | yes | APP_MODE=(unset) |
| BASE_URL | PASS | yes | http://localhost:3000 |
| Runtime Console (FE) | PASS | yes | ok status=200 |
| API health | PASS | no | ok |
| Redis | PASS | yes | 127.0.0.1:6379 |
| PostgreSQL | PASS | yes | default 127.0.0.1:5432 |
| Search (OpenSearch / HTTP) | PASS | yes | HTTP search ok |
| Workers / filas | WARN | no | Redis up — workers não inspecionados (sem endpoint liveness dedicado) |
| Projection / catálogo indexado | PASS | no | search/cards respondeu |
| Storage | WARN | no | não auditado automaticamente — validar em staging com upload real |
| Upload | WARN | no | não auditado automaticamente — validar rota seller em campanha funcional |
| Migrations | WARN | no | DATABASE_URL ausente — não é possível verificar schema |
| Provider Registry (CI artefato) | PASS | yes | registry + lifecycle tests OK |
| Game Configuration | PASS | yes | GameConfiguration registry OK |

## Ready To Resume

Para retomar a campanha funcional (Marina Costa):

- [x] Runtime Console UP
- [x] API HEALTHY
- [x] Redis conectado
- [x] OpenSearch / Search HTTP
- [x] Projection sincronizada (search Rapunzel/cards)
- [x] BASE_URL válida
- [x] Provider Registry (testes verdes)
- [x] Game Configuration (testes verdes)
- [ ] Smoke PASS

↓ Corrigir itens acima → `npm run test:campaign:gates`

