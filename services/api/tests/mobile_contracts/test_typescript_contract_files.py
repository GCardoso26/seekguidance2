"""Contratos TypeScript presentes."""

from __future__ import annotations

from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
CONTRACTS = REPO / "apps" / "mobile" / "shared_contracts" / "typescript_contracts"


def test_typescript_contract_files() -> None:
    if not CONTRACTS.is_dir():
        pytest.skip("shared_contracts/typescript_contracts ausente neste checkout")
    for name in (
        "replay_lineage_contracts.ts",
        "replay_governance_contracts.ts",
        "runtime_reconciliation_contracts.ts",
        "sync_governance_contracts.ts",
        "replay_health_contracts.ts",
        "mobile_observability_contracts.ts",
        "EXAMPLES.md",
    ):
        assert (CONTRACTS / name).is_file()
