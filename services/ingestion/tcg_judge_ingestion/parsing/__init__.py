"""Parsing formal (multi-TCG)."""

from tcg_judge_ingestion.parsing.formal_router import formal_parse
from tcg_judge_ingestion.parsing.structured_sections import extract_semantic_sections
from tcg_judge_ingestion.parsing.tcg_dimensions import extract_formal_dimensions

__all__ = ["extract_formal_dimensions", "extract_semantic_sections", "formal_parse"]
