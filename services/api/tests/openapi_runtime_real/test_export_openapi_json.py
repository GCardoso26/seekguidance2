"""Exportação real openapi.runtime.vnext.json."""

from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real import export_openapi_json


def test_export_openapi_json_writes_file(tmp_path: Path) -> None:
    out = tmp_path / "openapi.runtime.vnext.json"
    meta = export_openapi_json(out)
    assert out.is_file()
    assert meta["schema_version"] == "runtime-vnext"
    assert meta["route_hash"]
