"""sprint docs operational validation."""
from pathlib import Path

import pytest

_DOCS = [
    "REAL_WORLD_OPERATIONAL_VALIDATION.md",
    "AUTONOMOUS_STEWARDSHIP_ORCHESTRATION.md",
    "ENTROPY_REDUCTION_AND_SIMPLIFICATION.md",
    "LONG_HORIZON_RESILIENCE.md",
    "EXECUTIVE_OPERATIONS_CENTER_V5.md",
    "PREDICTIVE_GOVERNANCE.md",
    "PUBLIC_OPERATIONAL_TRUST.md",
    "STRUCTURAL_ALIGNMENT_AND_CONVERGENCE.md",
    "FUTURE_CONTINUITY_FORECASTING.md",
    "RUNTIME_EVOLUTIONARY_STABILITY.md",
]
_REPO = Path(__file__).resolve().parents[4]


@pytest.mark.parametrize("name", _DOCS)
def test_doc_exists(name: str) -> None:
    assert (_REPO / "docs" / name).is_file()
