# Cache runtime

Cache semântico **assistido**:

- TTL separado para embeddings vs. respostas determinísticas de replay
- invalidação em `cross_version_merge` / policy delta

Persistência opcional descrita em `infra/semantic_storage`.
