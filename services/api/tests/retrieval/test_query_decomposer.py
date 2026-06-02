"""Testes do query decomposer (Wave 2A)."""

from __future__ import annotations

import pytest

from app.retrieval.query_decomposer import (
    build_sub_queries,
    detect_mechanics,
    decompose_and_retrieve,
    should_decompose,
)


def test_detect_mechanics_mtg():
    mechs = detect_mechanics("Como Trample interage com Deathtouch?", "mtg")
    assert "trample" in mechs
    assert "deathtouch" in mechs


def test_should_decompose_single_mechanic_false():
    assert should_decompose("O que é Flying?", "mtg") is False


def test_should_decompose_two_mechanics_true():
    assert should_decompose("Flying vs Reach", "mtg") is True


def test_build_sub_queries_includes_original():
    mechs = ["trample", "deathtouch"]
    qs = build_sub_queries("Como interagem?", mechs, "mtg")
    assert len(qs) == 3
    assert qs[-1] == "Como interagem?"


@pytest.mark.asyncio
async def test_parallel_retrieval_graceful_partial_failure():
    calls: list[str] = []

    async def retrieve_fn(q, _slug):
        calls.append(q)
        if "Deathtouch" in q:
            raise RuntimeError("fail")
        return [{"id": q}]

    out = await decompose_and_retrieve(
        "Como Trample interage com Deathtouch?",
        "mtg",
        retrieve_fn,
        top_k=5,
    )
    assert isinstance(out, list)
    assert len(out) >= 1


@pytest.mark.asyncio
async def test_merge_deduplicates_by_id():
    async def retrieve_fn(q, _slug):
        return [{"id": "shared"}, {"id": q}]

    out = await decompose_and_retrieve("Flying vs Reach", "mtg", retrieve_fn, top_k=10)
    ids = [x["id"] for x in out]
    assert len(ids) == len(set(ids))
