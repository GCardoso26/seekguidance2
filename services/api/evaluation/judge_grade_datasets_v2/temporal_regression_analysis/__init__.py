"""Análise de regressão temporal (política / errata)."""

from __future__ import annotations

from typing import Any


def temporal_regression_drift_stub(policy_versions: list[str]) -> dict[str, Any]:
    return {
        "policy_versions": policy_versions,
        "drift_score": 0.1 * max(0, len(policy_versions) - 1),
        "assistant_notes": ["Drift elevado sugere reindexar corpus e replay lineage."],
    }
