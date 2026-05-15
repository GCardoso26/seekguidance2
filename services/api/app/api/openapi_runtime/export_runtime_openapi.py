"""Export OpenAPI modular (sem FastAPI hacks pesados)."""

from __future__ import annotations

from typing import Any

from app.api.openapi_runtime.mobile_runtime_schema_bundle import mobile_runtime_schema_bundle_stub
from app.api.openapi_runtime.replay_runtime_schema_bundle import replay_runtime_schema_bundle_stub
from app.contracts import ReplayRefBody, ReplayValidateIn


def build_runtime_openapi_bundle_stub() -> dict[str, Any]:
    return {
        "openapi": "3.1.0",
        "info": {"title": "TCG Judge Runtime", "version": "runtime-stub"},
        "paths": {
            "/v1/replay/health": {"get": {"summary": "replay health"}},
            "/v1/replay/validate": {"post": {"summary": "replay validate"}},
        },
        "components": {
            "schemas": {
                "ReplayRefBody": ReplayRefBody.model_json_schema(),
                "ReplayValidateIn": ReplayValidateIn.model_json_schema(),
            }
        },
        "assistant_notes": ["build_runtime_openapi_bundle: modular; reasoning_v1…v11 inalterados."],
    }


def export_mobile_contract_bundle_stub() -> dict[str, Any]:
    return mobile_runtime_schema_bundle_stub("mobile")


def export_runtime_openapi_document_stub() -> dict[str, Any]:
    return {
        "bundle": build_runtime_openapi_bundle_stub(),
        "replay": replay_runtime_schema_bundle_stub("replay"),
        "assistant_notes": ["export_runtime_openapi: desacoplado do app.main."],
    }
