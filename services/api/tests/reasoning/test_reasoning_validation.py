"""Testes da camada de validação."""

from app.reasoning.engine import run_reasoning_engine
from app.reasoning.execution.interaction_chain import dummy_hit


def test_validation_report_shape() -> None:
    q = "How does APNAP affect triggered abilities?"
    hits = [dummy_hit("603.1", "trigger"), dummy_hit("117.1", "priority")]
    r = run_reasoning_engine(q, hits, "mtg", settings=None)
    d = r.to_api_dict()["validation"]
    assert "reasoning_valid" in d
    assert "ambiguity_level" in d
    assert "unsupported_steps" in d
