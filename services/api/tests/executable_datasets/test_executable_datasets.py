"""Executable datasets engine."""

from __future__ import annotations

from executable_datasets import executable_case_bundle_stub
from executable_datasets.executable_apnap_cases import executable_apnap_case_stub
from executable_datasets.executable_combat_chain_cases import executable_combat_chain_case_stub
from executable_datasets.executable_cross_version_legality_cases import executable_cross_version_legality_stub
from executable_datasets.executable_legality_cases import executable_legality_case_stub
from executable_datasets.executable_multiplayer_cases import executable_multiplayer_case_stub
from executable_datasets.executable_ontology_drift_cases import executable_ontology_drift_case_stub
from executable_datasets.executable_replacement_recursion_cases import executable_replacement_recursion_stub
from executable_datasets.executable_replay_divergence_cases import executable_replay_divergence_case_stub
from executable_datasets.executable_segoc_cases import executable_segoc_case_stub
from executable_datasets.executable_timing_cases import executable_timing_case_stub


def test_bundle() -> None:
    b = executable_case_bundle_stub("legality")
    assert "replay_refs" in b


def test_legality_case() -> None:
    assert executable_legality_case_stub("c1", "legal")["expected"] == "legal"


def test_timing_case() -> None:
    assert executable_timing_case_stub(["a"])["tags"] == ["a"]


def test_multiplayer() -> None:
    assert executable_multiplayer_case_stub(4)["players"] == 4


def test_replacement() -> None:
    assert executable_replacement_recursion_stub(3, 5)["within_cap"] is True


def test_apnap() -> None:
    assert executable_apnap_case_stub(["p1", "p2"])["turn_order"] == ["p1", "p2"]


def test_segoc() -> None:
    assert executable_segoc_case_stub(True)["mandatory_first"] is True


def test_combat_chain() -> None:
    assert executable_combat_chain_case_stub(3)["layers"] == 3


def test_ontology_drift() -> None:
    assert executable_ontology_drift_case_stub(0.2)["delta"] == 0.2


def test_replay_divergence() -> None:
    assert executable_replay_divergence_case_stub("a", "b")["divergent"] is True


def test_cross_version() -> None:
    assert executable_cross_version_legality_stub("v0", "v1")["to"] == "v1"
