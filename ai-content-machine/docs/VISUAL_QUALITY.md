# Visual Quality & Consistency

O CWM já produz MP4. Este documento cobre a segunda pergunta: **o Short parece profissional?**

## Separação de responsabilidades

| Camada | Decide |
|--------|--------|
| Script / Visual Director | **o que** mostrar (subject, action, environment) |
| `VisualProfile` | **como** mostrar (style, lighting, camera, negative) |
| ComfyUI | **render** (`image_a1_cpu` na A1 vs cinematic no PC) |
| Visual QA | **se ficou bom o bastante** para Library / publish |

O LLM **não** inventa a estética. Escolhe no máximo o `profileId` via niche/keywords; o JSON em `api/src/production/visual/profiles/` manda.

## Pipeline

```
SCRIPT
  → VisualDirector.buildVisualPlan (character lock + 3–5 cenas)
  → Storyboard com prompt SUBJECT/CAMERA/STYLE (nunca "Dark content scene…")
  → Asset Library searchBest (só quality_status=APPROVED ∧ score ≥ limiar)
       HIT → reuse
       MISS → ComfyUI (negative do profile) → Mock se falhar
  → Visual QA (magic, tamanho, score, anti-mock)
       APPROVED → catalog reutilizável
       REJECTED → catalog auditável, mas nunca reutilizado
  → Ken Burns → Media QA → PublishingQualityGate
```

## Profiles

`documentary`, `finance`, `technology`, `news`, `luxury`, `history`, `mystery`, `gaming`.

Override: `CWM_VISUAL_PROFILE=finance`.

## Env

| Var | Default | Notas |
|-----|---------|--------|
| `CWM_VISUAL_PROFILE` | `documentary` | fallback se keywords não baterem |
| `VISUAL_QA_MIN_SCORE` | `0.7` | aesthetic gate da Library |
| `COMFY_NEGATIVE_PROMPT` | (profile manda primeiro) | só se a cena não trouxer negative |

Não mexer em `OLLAMA_*` / `KOKORO_*` para este PR.

## A1 CPU vs qualidade de prompt

Separe sempre:

1. **Prompt / profile** — testável sem GPU (unit tests + dry storyboard)
2. **Modelo / workflow** — compare o **mesmo** prompt+seed em `image_a1_cpu` (VPS) vs `image_cinematic` (PC GPU)

Se o PC ficar drasticamente melhor com o mesmo prompt, o gargalo é inferência — não o Director.

O Visual QA actual é **heurístico** (magic PNG, tamanho, provider, marcadores SUBJECT/CAMERA). Não é um modelo CLIP de estética — isso fica para um PR seguinte.

Assets `generated` anteriores a este PR ficam `PENDING` na migração 008 e **não** entram em HIT até um novo generate + QA APPROVED.

## Character consistency

Cada `VisualPlan` trava um `character` (idade, cabelo, roupa) em **todas** as cenas via `CHARACTER LOCK`.  
Img2img / IP-Adapter fica para um PR seguinte (ponte GPU); na A1 o lock textual já remove o salto homem→anime→mulher.

## Publish gate

Além de `mock_visual` → hold:

- `metadata.visualQa.status=REJECTED` → `visuals_qa_rejected:…` → `READY_FOR_REVIEW`

## Operador

Na UI Automation Center, o detalhe do run mostra `VISUALS=comfyui` e o storyboard deixa de começar com “Dark content…”.  
Regenerate com Comfy READY para re-catalogar frames APPROVED.
