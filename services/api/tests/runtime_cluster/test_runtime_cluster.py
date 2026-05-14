from app.runtime.production_runtime import runtime_cluster_governance_stub


def test_runtime_cluster_governance() -> None:
    assert runtime_cluster_governance_stub("balanced")["policy"] == "balanced"
