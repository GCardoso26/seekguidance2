# QA Strategy

## Script QA

`ScriptQaService` valida:

- seções obrigatórias
- CTA presente
- claims proibidos
- marcadores de alucinação
- duração estimada vs target da plataforma

Scores: hookStrength, clarity, novelty, retentionPotential, platformFit, ctaQuality, factualRisk.

## Safety outcomes

| Resultado | Persistência |
|-----------|--------------|
| pass | `status=ready`, `qa_status=passed` |
| requires_review | `status=requires_review` — sem auto-approve |
| fail | `status=failed` |

## Research quality

- source traceability obrigatória
- fingerprint anti-duplicata
- scoreBreakdown explicável
