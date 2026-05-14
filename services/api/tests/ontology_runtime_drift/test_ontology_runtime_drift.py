from app.observability.live_runtime import live_ontology_drift_runtime_stub


def test_ontology_runtime_drift_stub() -> None:
    assert live_ontology_drift_runtime_stub(0.2)["drift_score"] == 0.2
