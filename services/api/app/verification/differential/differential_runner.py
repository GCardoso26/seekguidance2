"""Runner de differential simulation."""

from __future__ import annotations

from typing import Any

from app.verification.differential.differential_comparator import compare_pipelines
from app.verification.differential.replay_differences import explain_replay_differences
from app.verification.differential.semantic_diff_analysis import classify_semantic_divergence
from app.verification.differential.simulation_pairing import build_pair_payload


def run_differential_simulation(question: str, roles: list[str], replay_hash: str) -> dict[str, Any]:
    pair = build_pair_payload(question, roles, replay_hash)
    compared = compare_pipelines(pair["pipeline_a"], pair["pipeline_b"])
    compared["differences_detail"] = explain_replay_differences(compared["differences_detected"])
    compared.update(classify_semantic_divergence(float(compared["semantic_divergence"])))
    return compared
