from app.observability.runtime_exporters import replay_governance_exporter_stub


def test_operational_obs_exporter() -> None:
    out = replay_governance_exporter_stub("gov")
    assert "tcg_judge" in out["prometheus_prefix"]
