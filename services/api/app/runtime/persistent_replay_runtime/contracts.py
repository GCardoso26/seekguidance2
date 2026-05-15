"""Contratos de storage incremental (sqlite / realm / filesystem / futuros)."""

from __future__ import annotations

from enum import Enum
from typing import Any, Protocol, runtime_checkable


class StorageDialect(str, Enum):
    SQLITE = "sqlite"
    REALM = "realm"
    FILESYSTEM = "filesystem"
    REDIS = "redis_placeholder"
    POSTGRES = "postgres_placeholder"


@runtime_checkable
class ReplayStorageBackend(Protocol):
    """Backend leve; implementações reais ficam fora do núcleo reasoning."""

    def dialect(self) -> StorageDialect: ...
    def health(self) -> dict[str, Any]: ...
