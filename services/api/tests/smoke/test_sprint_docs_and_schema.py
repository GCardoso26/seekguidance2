"""Smoke: documentação da sprint e schema golden human presentes."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

pytestmark = pytest.mark.smoke

REPO = Path(__file__).resolve().parents[4]
DOCS = [
    "REAL_CORPUS_MATURITY.md",
    "FORMAL_CORRECTNESS_RUNTIME.md",
    "JUDGE_WORKSTATION_UX.md",
    "PRODUCTION_RUNTIME_INFRA.md",
    "CONTINUOUS_EVALUATION_PLATFORM.md",
    "MULTITCG_NORMALIZATION_MATURITY.md",
    "OPERATIONAL_OBSERVABILITY.md",
    "EXPLOSION_CONTROL.md",
    "CROSS_TCG_PRESSURE.md",
    "CORPUS_REALITY_HARDENING.md",
    "OPERATIONAL_CONFIDENCE.md",
    "WORKER_ORCHESTRATION_RUNTIME.md",
    "OPERATIONAL_STABILITY_SPRINT.md",
    "JUDGE_ASSISTANT_PRODUCTION_INTELLIGENCE.md",
    "JUDGE_GRADE_OPERATIONAL_INTELLIGENCE.md",
    "JUDGE_OPERATIONAL_PLATFORM.md",
    "JUDGE_RUNTIME_EVOLUTION_VNEXT.md",
    "JUDGE_GRADE_RUNTIME_GOVERNANCE.md",
    "JUDGE_RUNTIME_CONTINUOUS_EVOLUTION_VNEXT.md",
    "JUDGE_RUNTIME_OPERATIONAL_PLATFORM_VNEXT.md",
    "AWS_RUNTIME_PLATFORM.md",
    "AWS_DEPLOY_GUIA_PASSO_A_PASSO.md",
    "MOBILE_FIRST_ARCHITECTURE.md",
    "MOBILE_JUDGE_ASSISTANT_PLATFORM.md",
    "MOBILE_EDGE_RUNTIME_PLATFORM.md",
    "MOBILE_REPLAY_GOVERNANCE.md",
    "MOBILE_OFFLINE_SYNC_ARCHITECTURE.md",
    "RUNTIME_RECONCILIATION_PLATFORM.md",
    "JUDGE_RUNTIME_PERSISTENCE.md",
    "HYBRID_RUNTIME_GOVERNANCE.md",
    "EXECUTABLE_REPLAY_DATASETS.md",
]


@pytest.mark.parametrize("name", DOCS)
def test_sprint_doc_exists(name: str) -> None:
    assert (REPO / "docs" / name).is_file()


def test_golden_human_schema_json() -> None:
    p = REPO / "services" / "api" / "evaluation" / "golden_human_answers" / "schema.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    assert data.get("title") == "GoldenHumanAnswer"
