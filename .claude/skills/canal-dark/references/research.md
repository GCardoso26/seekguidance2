# Research

Usar `ResearchService` / `POST /api/research/run`. Não criar crawler paralelo.

## Entregar

- fontes (URL + título + `source_trace`)
- factos verificáveis
- concorrentes (ângulos, não cópia)
- títulos e thumbnails observados
- hooks
- riscos (direitos, claims, saturação)
- oportunidades / gaps
- diferenciação

## Regras

- Informação atualizada ou verificável → pesquisar **antes** de afirmar.
- Provider ausente → `NOT_CONFIGURED` + mock CWM se `AUTOMATION_MODE=mock`.
- Não copiar concorrentes.
- Artefacto: `research.json` (template + `POST /api/editorial/package`).

## Validação

Topic sem fonte rastreável não avança para IDEA. Dedup por fingerprint já existe no CWM (`Deduplicator`).
