"""OpenAPI snapshot validation."""

from __future__ import annotations

from openapi_contract_validation import openapi_snapshot_validation_stub


def test_openapi_snapshot_validation() -> None:
    v = openapi_snapshot_validation_stub("snap")
    assert v["schema_drift_score"] >= 0
    assert v["replay_runtime_alignment"] > 0
