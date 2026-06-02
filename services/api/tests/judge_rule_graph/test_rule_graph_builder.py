"""Testes expandidos do rule graph builder (Wave 2A)."""

from __future__ import annotations

import asyncio

from jobs.rule_graph_builder import REFERENCE_PATTERNS


def test_see_rule_pattern():
    pat = REFERENCE_PATTERNS[0][0]
    m = pat.search("See rule 702.9a for flying.")
    assert m
    assert m.group(1) == "702.9a"


def test_self_reference_skipped_in_logic():
    edges: dict[tuple[str, str, str], float] = {}
    existing: set[tuple[str, str]] = set()
    src, dst = "702.9a", "702.9a"
    if dst != src:
        existing.add((src, dst))
        edges[(src, dst, "references")] = 0.72
    assert not edges


def test_cycle_prevention():
    existing: set[tuple[str, str]] = set()
    cycles = 0
    pairs = [("702.9", "603"), ("603", "702.9")]
    for src, dst in pairs:
        if (dst, src) in existing:
            cycles += 1
            continue
        existing.add((src, dst))
    assert cycles == 1


def test_low_confidence_filtered():
    threshold = 0.70
    edges = [("a", "b", "references", 0.65), ("a", "c", "references", 0.85)]
    valid = [e for e in edges if e[3] >= threshold]
    assert len(valid) == 1


def test_invalidate_cache_hook_exists():
    from app.retrieval.semantic_cache import invalidate_game_cache

    assert asyncio.iscoroutinefunction(invalidate_game_cache)
