"""replay storage optimization."""
import importlib

import pytest

_PKG = "app.runtime.persistent_replay_runtime"
_MODULES = [
    "runtime_replay_storage_optimization_engine_v1",
    "runtime_replay_compaction_scoring_v1",
    "runtime_snapshot_dedup_optimization_v1",
    "runtime_storage_pressure_scoring_v1",
    "runtime_replay_archive_optimization_v1",
    "runtime_persistence_aging_analysis_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_replay_opt_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"rpo-{name}")
    assert r["integrity_status"] == "ok"
