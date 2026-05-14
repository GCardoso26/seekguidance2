from uuid import uuid4

from app.retrieval.fusion import rrf_merge as _rrf_merge


def test_rrf_merge_orders_overlap() -> None:
    a = uuid4()
    b = uuid4()
    c = uuid4()
    merged = _rrf_merge([[a, b], [b, c]])
    assert len(merged) == 3
    assert merged[b] > merged[a]
    assert merged[b] > merged[c]
