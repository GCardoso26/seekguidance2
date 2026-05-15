"""OpenAPI contract validation."""

from __future__ import annotations

from openapi_contract_validation import route_contract_validator_stub


def test_route_validator() -> None:
    v = route_contract_validator_stub("matrix")
    assert v["compatibility_score"] > 0
    assert "missing_routes" in v
