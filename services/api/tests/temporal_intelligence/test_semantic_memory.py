from app.memory.semantic_memory_store import SemanticMemoryStore
from app.memory.semantic_snapshots import make_snapshot


def test_semantic_memory_store() -> None:
    store = SemanticMemoryStore(max_entries=2)
    store.append({"type": "semantic", **make_snapshot("v1", {"a": 1})})
    store.append({"type": "semantic", **make_snapshot("v2", {"a": 2})})
    assert len(store.all()) == 2
