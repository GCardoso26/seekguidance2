"""Pipeline V10: Semantic Memory & Evolution Infrastructure."""

from __future__ import annotations

from app.evolution.bifurcation_detector import bifurcation_detected
from app.evolution.gameplay_fork_analysis import gameplay_behavior_change
from app.evolution.ontology_split_detection import ontology_split_detected
from app.games.semantic_core.temporal_comparison import temporal_semantic_comparison
from app.memory.historical_semantics import semantics_by_period
from app.memory.memory_compaction import compact_memory
from app.memory.ontology_memory import ontology_versions
from app.memory.semantic_lineage import lineage_edges
from app.memory.semantic_memory_store import SemanticMemoryStore
from app.memory.semantic_snapshots import make_snapshot
from app.memory.temporal_indexing import build_temporal_index
from app.ontology.gameplay_ontology import build_gameplay_ontology
from app.ontology.ontology_drift import ontology_drift_score
from app.ontology.semantic_taxonomy_evolution import taxonomy_shift
from app.reasoning.temporal.temporal_reasoner import run_temporal_reasoning
from app.reasoning.types import TemporalSemanticIntelligenceV10
from app.rules.lineage.gameplay_evolution_paths import evolution_paths
from app.rules.lineage.lineage_similarity import lineage_similarity
from app.rules.lineage.rule_lineage_graph import build_lineage_graph
from app.rules.lineage.semantic_ancestry import infer_ancestry
from app.runtime.history.historical_replay_index import historical_replay_index
from app.runtime.history.replay_archive import dedupe_replays
from app.runtime.history.replay_version_alignment import align_replay_versions
from app.runtime.history.semantic_replay_diff import replay_divergence
from app.verification.drift.deep_semantic_drift import deep_semantic_drift
from app.verification.drift.gameplay_behavior_drift import gameplay_behavior_drift
from app.verification.drift.temporal_consistency_analysis import temporal_consistency


def run_temporal_semantic_v10(
    *,
    question: str,
    game_slug: str,
    rule_id: str,
    v7_replay_hash: str,
) -> TemporalSemanticIntelligenceV10:
    memory = SemanticMemoryStore(max_entries=256)
    ontology = build_gameplay_ontology()
    snap_old = make_snapshot("2009", {"rule_id": rule_id, "ontology_nodes": ontology["ontology_nodes"][:6]})
    snap_new = make_snapshot("modern", {"rule_id": rule_id, "ontology_nodes": ontology["ontology_nodes"]})
    memory.append({"type": "semantic", "period": "2009", **snap_old})
    memory.append({"type": "semantic", "period": "modern", **snap_new})
    memory.append({"type": "ontology", "period": "modern", "version": f"{game_slug}_ontology_modern"})
    compacted = compact_memory(memory.all(), keep_last=128)
    tindex = build_temporal_index(compacted)

    temporal = run_temporal_reasoning(question, game_slug)
    period = str(temporal["historical_period"])
    historical_loaded = semantics_by_period(compacted, period)

    ancestors = infer_ancestry(rule_id)
    descendants = [f"{rule_id}_modern"]
    lineage_graph = build_lineage_graph(rule_id, ancestors, descendants)
    ev_paths = evolution_paths(rule_id)
    lineage_score = 1.0 - lineage_similarity(ancestors, descendants)
    lineage = {
        "ancestor_rules": ancestors,
        "descendant_rules": descendants,
        "semantic_divergence_score": round(lineage_score, 4),
        "lineage_graph_edges": lineage_edges(rule_id, ancestors, descendants),
        "lineage_graph_nodes": lineage_graph["nodes"],
    }

    old_nodes = snap_old["payload"]["ontology_nodes"]
    new_nodes = snap_new["payload"]["ontology_nodes"]
    taxonomy = taxonomy_shift(old_nodes, new_nodes)
    odrift = ontology_drift_score(
        relationship_delta=max(1, len(ontology["semantic_relationships"]) // 3),
        node_delta=max(0, len(new_nodes) - len(old_nodes)),
    )
    ontology_evo = {
        "ontology_changes_detected": ["node_growth", "relationship_refinement"],
        "semantic_taxonomy_shift": taxonomy,
        "ontology_drift": odrift,
    }

    replays = dedupe_replays([v7_replay_hash, f"{v7_replay_hash}_historical"])
    rindex = historical_replay_index([period, "modern"], replays[:2])
    ralign = align_replay_versions(replays, v7_replay_hash)
    rdiv = replay_divergence(replays[0], replays[-1])
    replay_history = {
        "historical_replays_compared": replays,
        "replay_divergence": rdiv,
        "replay_index": rindex,
        "version_alignment": ralign,
    }

    runtime_drift = gameplay_behavior_drift(len(ev_paths), len(descendants))
    deep = deep_semantic_drift([taxonomy, runtime_drift, rdiv])
    drift = {
        "deep_semantic_drift": deep,
        "runtime_behavior_drift": runtime_drift,
        "causal_drift": round(min(1.0, 0.5 * rdiv), 4),
        "temporal_consistency": temporal_consistency(deep),
    }

    bif = {
        "semantic_bifurcation_detected": bifurcation_detected(lineage_score, len(ev_paths)),
        "gameplay_behavior_change": gameplay_behavior_change(lineage_score),
        "ontology_split_detected": ontology_split_detected(taxonomy),
    }

    return TemporalSemanticIntelligenceV10(
        semantic_memory={
            "historical_snapshots_loaded": [s["version"] for s in historical_loaded],
            "semantic_lineage_detected": [rule_id, *ancestors, *descendants],
            "ontology_versions_traversed": ontology_versions(compacted),
            "temporal_index_keys": sorted(tindex.keys()),
        },
        temporal_reasoning={
            "historical_period": temporal["historical_period"],
            "runtime_version": temporal["runtime_version"],
            "historical_constraints": temporal["historical_constraints"],
            "semantic_differences": temporal["semantic_differences"],
        },
        semantic_lineage=lineage,
        ontology_evolution=ontology_evo,
        drift_analytics=drift,
        replay_history=replay_history,
        bifurcation_analysis={
            **bif,
            "cross_tcg_temporal_comparison": temporal_semantic_comparison(),
        },
    )
