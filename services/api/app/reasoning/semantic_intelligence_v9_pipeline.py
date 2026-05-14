"""Pipeline V9: Formal Rule Intelligence Platform."""

from __future__ import annotations

from app.games.semantic_core.abstract_semantics import semantic_adapter_capabilities
from app.graph.graph_semantic_similarity import semantic_similarity
from app.graph.interaction_graph_engine import interaction_clusters
from app.graph.ontology_graph_builder import build_ontology_graph
from app.graph.semantic_path_analysis import semantic_paths
from app.graph.semantic_rule_graph import build_semantic_rule_graph
from app.ontology.gameplay_ontology import build_gameplay_ontology
from app.reasoning.types import SemanticRuleIntelligenceV9
from app.rules.ambiguity.ambiguity_detector import detect_ambiguities
from app.rules.enrichment.semantic_enrichment import enrich_semantics
from app.rules.evolution.rule_evolution_tracker import track_rule_evolution
from app.rules.inference.implicit_dependency_engine import infer_implicit_dependencies
from app.rules.semantic_compiler.rule_compiler_v4 import compile_rule_text


def run_semantic_intelligence_v9(
    *,
    question: str,
    rule_id: str,
    excerpt: str,
    game_slug: str,
) -> SemanticRuleIntelligenceV9:
    compiled = compile_rule_text(rule_id, excerpt)
    tokens = list(compiled.get("semantic_ast", {}).get("nodes", []))
    token_values = [str(n.get("value", "")) for n in tokens]

    ontology = build_gameplay_ontology()
    ambiguity = detect_ambiguities(excerpt, token_values)
    deps = infer_implicit_dependencies(token_values)
    enrichment = enrich_semantics(token_values)

    rule_graph = build_semantic_rule_graph(rule_id, deps["implicit_dependencies"])
    ontology_graph = build_ontology_graph(ontology["ontology_nodes"], ontology["semantic_relationships"])
    paths = semantic_paths(rule_id, deps["implicit_dependencies"])
    similarity = semantic_similarity(rule_graph["nodes"], ontology_graph["nodes"])
    clusters = interaction_clusters(token_values)

    old_sem = {"runtime_annotations": []}
    new_sem = {"runtime_annotations": compiled["runtime_annotations"]}
    evolution = track_rule_evolution(old_sem, new_sem)

    return SemanticRuleIntelligenceV9(
        semantic_compilation={
            "rule_ast_generated": bool(compiled["rule_ast_generated"]),
            "semantic_constraints": compiled["semantic_constraints"],
            "timing_semantics": compiled["timing_semantics"],
            "runtime_annotations": enrichment["runtime_annotations"],
        },
        ontology_analysis={
            "ontology_nodes": ontology["ontology_nodes"],
            "semantic_relationships": ontology["semantic_relationships"],
            "cross_tcg_mappings": {
                "game": game_slug,
                "capabilities": semantic_adapter_capabilities(game_slug),
            },
        },
        ambiguity_detection={
            "ambiguities_detected": ambiguity["ambiguities_detected"],
            "semantic_uncertainty": ambiguity["semantic_uncertainty"],
            "judge_interpretation_risk": ambiguity["judge_interpretation_risk"],
        },
        dependency_inference={
            "implicit_dependencies": deps["implicit_dependencies"],
            "causal_relationships": deps["causal_relationships"],
            "procedural_dependencies": deps["procedural_dependencies"],
        },
        semantic_graph={
            "graph_paths_used": paths,
            "semantic_similarity": similarity,
            "interaction_clusters": clusters,
        },
        rule_evolution={
            "semantic_behavior_change": evolution["semantic_behavior_change"],
            "runtime_semantic_stability": evolution["runtime_semantic_stability"],
        },
    )
