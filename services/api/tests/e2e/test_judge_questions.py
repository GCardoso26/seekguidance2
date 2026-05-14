"""E2E: perguntas obrigatórias (manual com RUN_E2E=1)."""

import os

import httpx
import pytest

pytestmark = pytest.mark.e2e

QUESTIONS = [
    ("layers_timestamps", "How do dependency layers interact with timestamps?", False),
    ("two_continuous", "What happens if two continuous effects modify the same object?", False),
    ("replacement_delayed_trigger", "How does a replacement effect alter a delayed trigger interaction?", False),
    ("continuous_sba", "How do continuous modifiers interact with SBA?", False),
    ("identity_exile", "How does object identity persist through exile and return?", False),
    ("damage_stack_hist", "How did damage use the stack historically?", True),
    ("v7_layers_compose", "How do continuous effects compose across multiple layers?", False),
    ("v7_recursive_replacement", "What happens if recursive replacement effects occur?", False),
    ("v7_simultaneous_mutations", "How are simultaneous state mutations resolved?", False),
    ("v7_deterministic_replay", "How does deterministic replay validate identical outcomes?", False),
    ("v7_conflicting_modifiers", "How are conflicting continuous modifiers resolved?", False),
    ("v8_recursive_replay", "Do recursive replacement effects produce deterministic replay?", False),
    ("v8_semantic_drift", "How does the runtime detect semantic drift between rule versions?", False),
    ("v8_illegal_state", "What happens if conflicting continuous effects produce illegal states?", False),
    ("v8_replay_legality", "How does replay validation ensure deterministic legality?", False),
    ("v8_adversarial_instability", "How does adversarial runtime testing detect instability?", False),
    ("v9_semantic_compiler", "How does the semantic compiler model replacement effects?", False),
    ("v9_implicit_dependencies", "What implicit dependencies exist between SBA and replacement effects?", False),
    ("v9_ontology_alignment", "How does ontology alignment work across MTG and Yu-Gi-Oh?", False),
    ("v9_timing_ambiguities", "What semantic ambiguities exist in this timing interaction?", False),
    ("v9_semantic_evolution", "How does the system detect semantic evolution between rule versions?", False),
    ("v10_damage_stack", "How did damage on the stack differ from modern MTG?", False),
    ("v10_legend_rule", "What historical semantic changes affected the legend rule?", False),
    ("v10_ygo_timing", "How did timing semantics evolve in Yu-Gi-Oh?", False),
    ("v10_rule_drift", "What semantic drift occurred between these rule versions?", False),
    ("v10_replay_history", "How does the replay engine compare historical gameplay states?", False),
    ("v11_distributed_state", "How is distributed semantic state partitioned for a live match?", False),
    ("v11_judge_session", "What does the judge session engine expose when reconstructing the stack?", False),
    ("v11_timeline", "How can we reconstruct the timeline before an illegal game state?", False),
    ("v11_apnap", "How does APNAP order simultaneous responses in multiplayer?", False),
    ("v11_tournament_ops", "What operational tournament guidance exists for deck validation?", False),
]


@pytest.mark.parametrize("qid,question,pref_hist", QUESTIONS)
@pytest.mark.skipif(os.getenv("RUN_E2E") != "1", reason="RUN_E2E=1 + API com dados.")
def test_chat_ask_judge_questions(qid: str, question: str, pref_hist: bool) -> None:
    base = os.getenv("E2E_API_BASE", "http://127.0.0.1:8000").rstrip("/")
    payload = {
        "game_slug": "mtg",
        "question": question,
        "mode": "judge",
        "prefer_historical": pref_hist,
        "explain_retrieval": True,
        "include_reasoning_engine": True,
    }
    r = httpx.post(f"{base}/v1/chat/ask", json=payload, timeout=120.0)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("confidence", 0) >= 0.0
    assert isinstance(data.get("citations"), list)
    assert data.get("retrieval_reasons") is None or isinstance(data.get("retrieval_reasons"), list)
    if data.get("explainability") is not None:
        assert "graph_confidence" in data["explainability"]
    if qid != "damage_stack_hist" and data.get("reasoning_v3") is not None:
        rv3 = data["reasoning_v3"]
        assert isinstance(rv3.get("interaction_chain"), list)
        assert "conflicts_detected" in rv3
        assert "timing_analysis" in rv3
    if qid != "damage_stack_hist" and data.get("reasoning_v4") is not None:
        rv4 = data["reasoning_v4"]
        assert isinstance(rv4.get("validated_chain"), list)
        assert "constraint_analysis" in rv4
        assert "propagation_chain" in rv4
    if qid != "damage_stack_hist" and data.get("reasoning_v5") is not None:
        rv5 = data["reasoning_v5"]
        assert isinstance(rv5.get("symbolic_state_transition"), list)
        assert "state_legality" in rv5
        assert "structured_rules" in rv5
    if qid != "damage_stack_hist" and data.get("reasoning_v6") is not None:
        rv6 = data["reasoning_v6"]
        assert isinstance(rv6.get("causal_chain"), list)
        assert "layer_ordering" in rv6
        assert "object_lineage" in rv6
    if qid != "damage_stack_hist" and data.get("reasoning_v7") is not None:
        rv7 = data["reasoning_v7"]
        assert isinstance(rv7.get("compiled_ir"), list)
        assert isinstance(rv7.get("runtime_execution_order"), list)
        assert "deterministic_replay_hash" in rv7
    if qid != "damage_stack_hist" and data.get("reasoning_v8") is not None:
        rv8 = data["reasoning_v8"]
        assert "formal_verification" in rv8
        assert "differential_analysis" in rv8
        assert "replay_validation" in rv8
    if qid != "damage_stack_hist" and data.get("reasoning_v9") is not None:
        rv9 = data["reasoning_v9"]
        assert "semantic_compilation" in rv9
        assert "ontology_analysis" in rv9
        assert "ambiguity_detection" in rv9
    if qid != "damage_stack_hist" and data.get("reasoning_v10") is not None:
        rv10 = data["reasoning_v10"]
        assert "semantic_memory" in rv10
        assert "temporal_reasoning" in rv10
        assert "semantic_lineage" in rv10
    if qid != "damage_stack_hist" and data.get("reasoning_v11") is not None:
        rv11 = data["reasoning_v11"]
        assert "distributed_state" in rv11
        assert "judge_session" in rv11
        assert "timeline_analysis" in rv11
        assert "multiplayer_resolution" in rv11
        assert "tournament_operations" in rv11
        assert "persistent_memory" in rv11
        assert "distributed_replay" in rv11
        assert "runtime_observability" in rv11
