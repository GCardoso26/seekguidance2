"""Registry de artefatos versionados."""

from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real import register_runtime_artifact_history


def test_register_history(tmp_path: Path) -> None:
    meta = register_runtime_artifact_history(tmp_path)
    assert meta["schema_hash"]
    version_dir = Path(meta["history_path"])
    assert (version_dir / "incremental.manifest.json").is_file()
    assert (tmp_path / "registry.jsonl").is_file()
