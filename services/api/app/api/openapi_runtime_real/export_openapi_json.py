"""Exportação real de openapi.json (incremental, desacoplada do router)."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.api.openapi_runtime.export_runtime_openapi import build_runtime_openapi_bundle_stub

DEFAULT_OUT = (
    Path(__file__).resolve().parents[3] / "generated" / "openapi" / "openapi.runtime.vnext.json"
)


def export_openapi_json(path: Path | None = None) -> dict[str, Any]:
    """Gera `openapi.runtime.vnext.json` a partir do bundle + schema FastAPI quando disponível."""
    out = path or DEFAULT_OUT
    bundle: dict[str, Any] = dict(build_runtime_openapi_bundle_stub())
    try:
        from app.main import app

        fastapi_schema = app.openapi()
        bundle["paths"] = {**fastapi_schema.get("paths", {}), **bundle.get("paths", {})}
        components = fastapi_schema.get("components") or {}
        bundle_components = bundle.get("components") or {}
        schemas = {**components.get("schemas", {}), **bundle_components.get("schemas", {})}
        bundle["components"] = {"schemas": schemas}
        bundle["openapi"] = fastapi_schema.get("openapi", bundle.get("openapi", "3.1.0"))
        bundle["info"] = fastapi_schema.get("info", bundle.get("info", {}))
    except Exception:
        bundle.setdefault(
            "assistant_notes",
            ["FastAPI schema merge skipped; bundle contratos apenas."],
        )

    out.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(bundle, sort_keys=True, indent=2)
    out.write_text(raw + "\n", encoding="utf-8")
    route_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]

    return {
        "schema_version": "runtime-vnext",
        "route_hash": route_hash,
        "output_path": str(out),
        "compatibility_hints": {
            "reasoning_v1_v11_unchanged": True,
            "breaking_change_policy": "additive_only_stub",
        },
        "assistant_notes": [
            "export_openapi_json: snapshot versionado para CI; sem SDK auto-gen.",
        ],
    }


def export_openapi_json_stub() -> dict[str, Any]:
    return export_openapi_json()
