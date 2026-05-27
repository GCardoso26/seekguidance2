"""Testes formatação de fontes Judge."""

from __future__ import annotations

from app.judge.sources import sources_from_citations
from app.schemas.chat import ChatCitation


def test_sources_include_rule_path_and_page() -> None:
    cites = [
        ChatCitation(
            document_title="Comprehensive Rules",
            source_url="https://example.com/cr.pdf",
            section_path="702.19",
            rule_path="702.19a",
            excerpt="Trample damage assignment.",
            page_number=42,
        )
    ]
    sources = sources_from_citations(cites)
    assert len(sources) == 1
    assert sources[0].rule_path == "702.19a"
    assert sources[0].page_number == 42
    assert "#page=42" in sources[0].url
