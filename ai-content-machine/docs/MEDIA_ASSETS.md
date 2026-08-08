# Media Assets

Tabela `media_assets` — registry versionado de artefatos de produção.

## Tipos

`AUDIO` · `IMAGE` · `VIDEO` · `SUBTITLE` · `THUMBNAIL` · `FINAL_VIDEO`

## sourceType

`MOCK` · `GENERATED` · `STOCK` · `UPLOADED`

`UNKNOWN` é **proibido** como sourceType publicável.

## Campos-chave

- `uri`, `mimeType`, `fileSize`, `duration`, `width`, `height`
- `checksum` SHA-256 (obrigatório)
- `license` — se `UNKNOWN` → produção `REQUIRES_REVIEW`
- `provider`, `metadata` (prompt, sourceUrl, generatedAt, scene)
- `parentAssetId`, `version`, `isCurrent`
- `assetKey` — identidade lógica (`voice`, `visual:scene:1`, `subtitle:srt`, `final_video`, …)

## Versionamento

Regenerar cria `vN+1` e marca anteriores `is_current=0`. Nunca sobrescreve silenciosamente.

## Traceability visual

Cada visual registra `sourceUrl`, `provider`, `prompt`, `license`, `generatedAt`.
