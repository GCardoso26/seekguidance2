---
name: canal-dark
description: >-
  Orquestra produção faceless/dark de YouTube sobre o CWM existente
  (research, ideias, roteiro, Visual Director, voz, composição, Shorts,
  thumbnail, QA, rights, pacote). Use quando o utilizador pedir conteúdo
  YouTube faceless, canal dark, CWM editorial, storyboard, Visual Bible,
  READY_FOR_PUBLISH ou pacote de publicação. Não cria uma segunda fábrica.
---

# canal-dark

Cérebro editorial. O CWM (`ai-content-machine/`) é o motor.

```
canal-dark → EDITORIAL / ORQUESTRAÇÃO → CWM → EXECUÇÃO TÉCNICA
```

Nunca crie ProductionService, TTS, compositor, cliente ComfyUI ou camada LLM paralelos.

## Quando usar

- Produzir vídeo faceless/dark para YouTube (long-form, Short, thumbnail, pacote)
- Retomar uma produção CWM (`VOICE=DONE` → retomar em `COMPOSITION`, não reconstruir)
- Decidir ângulo, briefing, Visual Bible, gates e se o pacote é `READY_FOR_REVIEW` ou `READY_FOR_PUBLISH`

## Instrução ao agente

1. **INSPECT** — ler estado existente (`contentId` / `productionId` / stages). Correr `scripts/inspect-cwm.mjs`.
2. **PLAN** — `POST /api/editorial/dry-run` (não destrutivo). Mostrar stage, provider, output, dependências.
3. **EXECUTE** — só contratos CWM reais (tabela abaixo). Briefing editorial aqui; execução lá.
4. **VERIFY** — QA + Rights Gate + `PublishingQualityGate`. Mock visual **nunca** publica.
5. **REPORT** — pacote verificável + limitações (`NOT_CONFIGURED` se API ausente).

## Workflow

CHANNEL → RESEARCH → VALIDATION → IDEA → ANGLE → TITLE → SCRIPT → FACT CHECK → VISUAL PLAN → VOICE → VISUALS → COMPOSITION → SUBTITLES → THUMBNAIL → SHORT → METADATA → QA → RIGHTS → PACKAGE

Detalhe: [references/workflow.md](references/workflow.md)

## Contratos CWM (obrigatório reutilizar)

| Capacidade | Contrato |
|---|---|
| Script | `FallbackScriptProvider` (Ollama → API → Mock) via `POST /api/scripts/generate` |
| Voz | `FallbackVoiceProvider` (Kokoro → API → Mock) — registar provider efetivo |
| Visuais | Library HIT → reuse; MISS → `createVisualResolver()` (ComfyUI → Mock). Comfy **não** entra em `ProductionService` nem no compositor |
| Plano visual | `VisualDirector` / `VisualPlan` canónico (não forçar schema paralelo) |
| Composição | `CompositionProvider` + `VideoComposer` (FFmpeg Ken Burns) |
| Pacote técnico | `ContentPackageBuilder` |
| Publish | `PublishingQualityGate` é soberano |
| Dry-run YouTube | `POST /api/validation/dry-run-report` |
| Status fábrica | `GET /api/factory/status` |
| Editorial (esta skill) | `/api/editorial/*` |

APIs de execução: `/api/research/run`, `/api/ideas`, `/api/scripts/generate`, `/api/production/run`, `/api/publishing/run`.

## Qualidade e gates

- **Visual Director** antes de qualquer prompt: SCRIPT → Visual Bible → Visual Plan → Library → Comfy se MISS → Visual QA → Composition.
- Proibido: prompt aleatório por cena; estética deep-web / AI slop (ver [references/visual-direction.md](references/visual-direction.md)).
- `mock_visual` pode gerar MP4 → **`READY_FOR_REVIEW`**. Nunca `READY_FOR_PUBLISH`.
- Rights `UNKNOWN` / `RESTRICTED` bloqueiam publicação automática.
- Originality / Repetition acima do limiar → `REVIEW_REQUIRED`.
- Aprovação humana: script não aprovado → não produzir (exceto testes `allowUnapproved`).
- Não prometa monetização. Texto canónico em [references/metadata.md](references/metadata.md).

## Honestidade operacional

- Sem API/provider: `NOT_CONFIGURED`. Não inventar endpoints nem credenciais.
- Sem FFmpeg/Comfy/TTS: degradar com a cadeia real e reportar o provider efetivo.
- Não substituir outputs aprovados; não apagar produções; idempotência via `contentId` / `productionId` / `version` / `sha256`.
- Batch só sobre o pipeline CWM (isolamento de falhas, sem engine paralelo).

## Referências

- [operating-model.md](references/operating-model.md)
- [workflow.md](references/workflow.md)
- [content-strategy.md](references/content-strategy.md)
- [research.md](references/research.md)
- [scripting.md](references/scripting.md)
- [visual-direction.md](references/visual-direction.md)
- [asset-library.md](references/asset-library.md)
- [voice.md](references/voice.md)
- [composition.md](references/composition.md)
- [shorts.md](references/shorts.md)
- [thumbnails.md](references/thumbnails.md)
- [metadata.md](references/metadata.md)
- [originality.md](references/originality.md)
- [rights.md](references/rights.md)
- [qa.md](references/qa.md)

Templates: [templates/](templates/). Exemplo: [examples/example-channel/](examples/example-channel/).
