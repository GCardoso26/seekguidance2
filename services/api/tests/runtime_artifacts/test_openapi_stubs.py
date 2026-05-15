"""Stubs OpenAPI runtime artifacts."""

from app.api.openapi_runtime_real import runtime_manifest_builder_stub


def test_manifest_builder_stub() -> None:
    p = runtime_manifest_builder_stub("ci")
    assert p["scope"] == "ci"
    assert p["deterministic_alignment"]["token"] == "op-ci"
