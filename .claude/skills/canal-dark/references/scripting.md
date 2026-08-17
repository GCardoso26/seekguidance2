# Scripting

A Skill escreve o **briefing**. A execução é `FallbackScriptProvider` + `ScriptFactoryService`.

Contrato CWM (não substituir):

```
hook, setup, problem, insight, value, proof, cta
```

## Long-form (briefing editorial)

```
HOOK → CONTEXT → OPEN LOOP → ACT 1 → ESCALATION → ACT 2 → REVELATION → ACT 3 → PAYOFF → CTA
```

Nunca começar por introdução genérica (“hoje vamos falar sobre…”).

Mapear para o contrato CWM na geração:

| Editorial | CWM |
|---|---|
| HOOK | hook |
| CONTEXT + OPEN LOOP | setup |
| ACT 1 | problem |
| ESCALATION + ACT 2 | insight / value |
| REVELATION + ACT 3 + PAYOFF | proof |
| CTA | cta |

## Shorts

Ver `shorts.md`. Estrutura: HOOK → CONTEXT → ESCALATION → PAYOFF → CTA.

`POST /api/editorial/shorts/adapt` — adaptação, não crop.

## Fact check

`ScriptQaService`: seções, CTA, claims proibidos, alucinação, duração, **originalityScore / repetitionScore**.

Claims de renda garantida falham QA. Não os use no briefing.
