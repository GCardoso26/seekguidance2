"""Fusão RRF dois ramos."""

from uuid import uuid4

from app.retrieval.fusion import weighted_rrf_merge_two_lists


def test_weighted_rrf_merge_stable():
    ids = [uuid4() for _ in range(4)]
    out = weighted_rrf_merge_two_lists([ids[0], ids[1]], [ids[2], ids[0]], weight_b=0.5)
    assert out[0] == ids[0]
