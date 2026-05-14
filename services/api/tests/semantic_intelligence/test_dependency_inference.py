from app.rules.inference.implicit_dependency_engine import infer_implicit_dependencies


def test_dependency_inference() -> None:
    out = infer_implicit_dependencies(["replacement", "trigger", "priority"])
    assert "implicit_dependencies" in out
    assert "causal_relationships" in out
