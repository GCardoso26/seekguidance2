"""Artefatos runtime materializados."""
from pathlib import Path

from app.api.openapi_runtime_real import materialize_runtime_artifacts


def test_materialize_writes_artifacts(tmp_path: Path) -> None:
    meta = materialize_runtime_artifacts(tmp_path)
    assert meta["schema_hash"]
    assert (tmp_path / "openapi" / "openapi.runtime.vnext.json").is_file()
    assert (tmp_path / "manifests" / "runtime.manifest.vnext.json").is_file()
    assert (tmp_path / "integrity" / "runtime.integrity.vnext.json").is_file()
