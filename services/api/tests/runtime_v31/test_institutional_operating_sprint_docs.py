"""docs sprint institutional."""
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
_DOCS = [
    "INSTITUTIONAL_GOVERNANCE_CONTINUITY.md",
    "OPERATIONAL_INSTITUTIONAL_MEMORY.md",
    "ORGANIZATIONAL_RESILIENCE_FABRIC.md",
    "HUMAN_GOVERNANCE_AND_EXECUTIVE_OVERSIGHT.md",
    "LONG_HORIZON_SUSTAINABILITY_SYSTEM.md",
    "CIVILIZATION_OPERATIONS_CENTER_V3.md",
    "STRUCTURAL_GOVERNANCE_AND_COMPLEXITY_CONTROL.md",
    "PUBLIC_INSTITUTIONAL_ECOSYSTEM_CONTINUITY.md",
    "OPERATIONAL_CONTINUITY_AND_SURVIVABILITY.md",
    "RUNTIME_INSTITUTIONAL_OPERATING_MODEL.md",
]


@pytest.mark.parametrize("name", _DOCS)
def test_doc_exists(name: str) -> None:
    assert (REPO / "docs" / name).is_file()
