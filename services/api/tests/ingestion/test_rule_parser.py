"""Testes do parser hierárquico de regras (ingestão)."""

from __future__ import annotations

import sys
from pathlib import Path

INGEST_ROOT = Path(__file__).resolve().parents[3] / "ingestion"
if str(INGEST_ROOT) not in sys.path:
    sys.path.insert(0, str(INGEST_ROOT))

from tcg_judge_ingestion.chunking.rule_parser import (  # noqa: E402
    RuleChunk,
    _merge_short_chunks,
    chunk_by_rule_hierarchy,
)

MTG_SAMPLE = """
702.9 Flying
702.9a A creature with flying can't be blocked except by creatures with flying.
702.9b A creature with flying can block a creature with flying.
702.10 First Strike
702.10a If a creature has first strike, it deals combat damage before creatures without first strike.
"""


def test_mtg_chunks_separate_atoms_same_subsection():
    chunks = chunk_by_rule_hierarchy(MTG_SAMPLE, "mtg", min_chunk_chars=10, max_chunk_chars=2000)
    atoms = [c.rule_atom for c in chunks if c.rule_atom]
    assert "702.9a" in atoms
    assert "702.9b" in atoms
    subsections = {c.rule_subsection for c in chunks if c.rule_atom and c.rule_atom.startswith("702.9")}
    assert "702.9" in subsections


def test_fallback_paragraph_without_numbering():
    text = "Paragraph one about the game.\n\nParagraph two with more detail.\n\nParagraph three."
    chunks = chunk_by_rule_hierarchy(text, "gundam", min_chunk_chars=5, max_chunk_chars=80)
    assert len(chunks) >= 1
    assert all(len(c.content) <= 80 for c in chunks)


def test_merge_short_chunks():
    short = RuleChunk(content="tiny", rule_subsection="1.1", rule_atom="1.1a")
    long = RuleChunk(content="x" * 120, rule_subsection="1.1", rule_atom="1.1b")
    merged = _merge_short_chunks([short, long], min_chars=100)
    assert len(merged) == 1
    assert "tiny" in merged[0].content
