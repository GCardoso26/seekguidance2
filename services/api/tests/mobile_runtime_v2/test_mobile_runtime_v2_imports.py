"""Pacotes mobile runtime v2."""

from __future__ import annotations

from app.mobile_runtime.mobile_replay_runtime_v2 import mobile_replay_compact_transport_v2_stub
from app.mobile_runtime.runtime_execution_v2 import mobile_runtime_execution_coordinator_v2_stub


def test_mobile_v2_stubs() -> None:
    e = mobile_runtime_execution_coordinator_v2_stub("d1")
    assert "deterministic_alignment" in e
    t = mobile_replay_compact_transport_v2_stub("r1")
    assert "replay_ref" in t
