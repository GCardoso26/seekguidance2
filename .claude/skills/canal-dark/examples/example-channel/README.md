# Exemplo fictício

Canal de teste da Skill `canal-dark`. Não é um canal real e não afirma monetização.

Percurso esperado (mock CWM):

1. `validate-content.mjs` neste diretório
2. `POST /api/editorial/ideas/score` + títulos
3. `POST /api/ideas` + `POST /api/scripts/generate`
4. `POST /api/editorial/shorts/adapt`
5. `POST /api/editorial/thumbnail/score`
6. `POST /api/production/run` (mocks reais)
7. `POST /api/editorial/package`

MP4 mock → `READY_FOR_REVIEW`. Nunca publish automático.
