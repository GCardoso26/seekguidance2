from app.edge_runtime import edge_reasoning_runtime_stub


def test_edge_reasoning() -> None:
    out = edge_reasoning_runtime_stub("x")
    assert out["edge_constraints"]["mem_mb_soft"] == 256
