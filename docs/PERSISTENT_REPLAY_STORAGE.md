# Persistência leve de replay

## SQLite

- `sqlite_snapshot_store.py` — snapshots versionados + `integrity_hash` (SHA-256 do JSON canonical).
- Variável opcional: `TCG_JUDGE_REPLAY_SQLITE_DIR`.

## Filesystem

- `filesystem_replay_archive.py` — arquivos JSON por `replay_ref` com metadados de hash.
- Variável opcional: `TCG_JUDGE_REPLAY_ARCHIVE_DIR`.

## Lineage

- `lineage_snapshot_store.py` — âncoras append-only na mesma base SQLite.

## Integridade

- `replay_integrity_store.py` — helpers de verificação de hash.

Sem cluster DB; uso local/juiz ou edge híbrido.
