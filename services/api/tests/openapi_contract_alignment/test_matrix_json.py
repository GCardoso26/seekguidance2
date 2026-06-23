"""Matriz OpenAPI / contratos."""

from __future__ import annotations

import json
from pathlib import Path

import pytest


def test_route_contract_matrix() -> None:
    p = (
        Path(__file__).resolve().parents[4]
        / "apps"
        / "mobile"
        / "shared_contracts"
        / "openapi_alignment"
        / "route_contract_matrix.json"
    )
    if not p.is_file():
        pytest.skip("route_contract_matrix.json ausente neste checkout")
    data = json.loads(p.read_text(encoding="utf-8"))
    assert any(r.get("path") == "/v1/replay/validate" for r in data["routes"])
