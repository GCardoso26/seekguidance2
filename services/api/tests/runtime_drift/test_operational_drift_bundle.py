from app.observability.runtime_exporters import ontology_drift_exporter_stub


def test_ontology_drift_exporter() -> None:
    out = ontology_drift_exporter_stub("drift")
    assert out["replay_lineage_trace_hint"] is True
