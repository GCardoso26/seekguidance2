# Production Storage

## Interface

```ts
interface AssetStorage {
  put(relPath, data): Promise<{ uri, checksum, fileSize }>
  get(relPath): Promise<Buffer>
  exists(relPath): Promise<boolean>
  delete(relPath): Promise<void>
}
```

## Implementações

| Adapter | Status |
|---------|--------|
| `LocalFilesystemStorage` | READY — root `data/assets` |
| `S3StorageStub` | NOT_CONFIGURED — nunca SUCCESS sem credenciais |

## Path padrão

```
workspaces/{workspaceId}/content/{contentId}/production/{productionId}/
  voice/
  visuals/
  subtitles/
  thumbnails/
  final/
```

## Segurança

- Bloqueia `../`, paths absolutos e escape do root
- Helper: `assetRelPath(...)`

## Checksum

Todo `put` / register calcula **SHA-256** para integridade, deduplicação e idempotência.
