"""OpenAPI runtime export layer."""

from __future__ import annotations

from app.api.openapi_runtime import build_runtime_openapi_bundle_stub, replay_runtime_contract_registry_stub


def test_openapi_bundle_has_schemas() -> None:
    b = build_runtime_openapi_bundle_stub()
    assert "components" in b
    assert "ReplayRefBody" in b["components"]["schemas"]


def test_contract_registry() -> None:
    r = replay_runtime_contract_registry_stub("x")
    assert "assistant_notes" in r
