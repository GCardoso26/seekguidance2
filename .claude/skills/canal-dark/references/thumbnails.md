# Thumbnails

O CWM extrai frame (`MockThumbnailProvider` / ffmpeg) para o asset técnico.

A Skill cria **conceito + prompt** e pontua 0–100:

`clarity`, `curiosity`, `contrast`, `subject`, `emotion`, `composition`, `mobile_readability`, `brand_consistency`

`POST /api/editorial/thumbnail/score`

Abaixo de `THUMBNAIL_COMPOSITE_MIN` (60) → `REVIEW_REQUIRED`.

Prompt: character lock + Visual Bible; sem texto ilegível na imagem; anti-deep-web no negative prompt.

Não afirmar que a thumbnail “vai performar”; só que o conceito passou ou não o limiar.
