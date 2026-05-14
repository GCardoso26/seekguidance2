"""Validação de arquivo de replay."""

from __future__ import annotations

from typing import Any


def replay_archive_validation_stub(archive_id: str, signed: bool) -> dict[str, Any]:
    return {"archive_id": archive_id, "valid": signed}
