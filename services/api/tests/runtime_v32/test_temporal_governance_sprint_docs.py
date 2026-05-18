"""docs sprint temporal governance."""
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
_DOCS = [
    "TEMPORAL_GOVERNANCE_SYSTEM.md",
    "EVOLUTIONARY_STABILITY_FABRIC.md",
    "OPERATIONAL_TIME_CONTINUITY.md",
    "CHANGE_GOVERNANCE_AND_EVOLUTION_CONTROL.md",
    "LONG_HORIZON_CONTINUITY_INTELLIGENCE.md",
    "TEMPORAL_OPERATIONS_CENTER_V4.md",
    "ARCHITECTURAL_LONGEVITY_AND_ENTROPY_CONTROL.md",
    "PUBLIC_EVOLUTIONARY_ECOSYSTEM_CONTINUITY.md",
    "OPERATIONAL_CONTINUITY_TIMELINE.md",
    "RUNTIME_TEMPORAL_GOVERNANCE_MODEL.md",
]


@pytest.mark.parametrize("name", _DOCS)
def test_doc_exists(name: str) -> None:
    assert (REPO / "docs" / name).is_file()
