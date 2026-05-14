import sys
from pathlib import Path

_workers = Path(__file__).resolve().parents[2].parent / "workers"


def test_worker_hints() -> None:
    sys.path.insert(0, str(_workers))
    from aws_worker_orchestration import aws_worker_runtime_hints

    out = aws_worker_runtime_hints(queue_name="q")
    assert out["queue_name"] == "q"
