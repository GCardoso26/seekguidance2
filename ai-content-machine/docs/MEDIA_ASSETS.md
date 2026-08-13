# Media Assets

## Duas camadas

| Camada | Tabela | Responsabilidade |
|--------|--------|------------------|
| Registry de produção | `media_assets` | Artefato versionado por `production_id` / `asset_key` |
| Asset Library | `media_library_assets` | Catálogo reutilizável (tags, usage_count) — **não** guarda bytes |

`AssetStorage` = arquivo físico. `MediaAssetRepository` = catálogo / busca / reuse.

## Registry (`media_assets`)

Tabela versionada de artefatos de produção.

### Tipos

`AUDIO` · `IMAGE` · `VIDEO` · `SUBTITLE` · `THUMBNAIL` · `FINAL_VIDEO`

### sourceType

`MOCK` · `GENERATED` · `STOCK` · `UPLOADED`

`UNKNOWN` é **proibido** como sourceType publicável.

### Campos-chave

- `uri`, `mimeType`, `fileSize`, `duration`, `width`, `height`
- `checksum` SHA-256 (obrigatório)
- `license` — se `UNKNOWN` → produção `REQUIRES_REVIEW`
- `provider`, `metadata` (prompt, sourceUrl, generatedAt, scene)
- `parentAssetId`, `version`, `isCurrent`
- `assetKey` — identidade lógica (`voice`, `visual:scene:1`, `subtitle:srt`, `final_video`, …)

### Versionamento

Regenerar cria `vN+1` e marca anteriores `is_current=0`. Nunca sobrescreve silenciosamente.

### Traceability visual

Cada visual registra `sourceUrl`, `provider`, `prompt`, `license`, `generatedAt`.

## Asset Library (`media_library_assets`)

VISUALS é **library-first**:

1. `deriveTagsFromPrompt` → tag match (sem embeddings)
2. **HIT** → reuse path + `usage_count++` + metadata observável (`asset_id`, `reuse_reason`, `matched_tags`, `match_score`)
3. **MISS** → provider visual atual → `catalog()`

Falha na library **não** quebra o `ProductionService` (fallback para o provider).

Campos: `path`, `sha256`, `type` (`image|audio|video`), `source`, `tags`, `usage_count`, `metadata`, `last_used_at`.
