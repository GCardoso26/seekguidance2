"""Edge cases para benchmark e assistência."""

from tcg_judge_ingestion.real_corpus.edge_case_corpus.hidden_dependency_cases import hidden_dependency_hint
from tcg_judge_ingestion.real_corpus.edge_case_corpus.paradox_cases import paradox_hint_stub
from tcg_judge_ingestion.real_corpus.edge_case_corpus.recursion_cases import recursion_depth_hint
from tcg_judge_ingestion.real_corpus.edge_case_corpus.replacement_loops import replacement_loop_hint
from tcg_judge_ingestion.real_corpus.edge_case_corpus.simultaneous_trigger_cases import simultaneous_hint

__all__ = [
    "hidden_dependency_hint",
    "paradox_hint_stub",
    "recursion_depth_hint",
    "replacement_loop_hint",
    "simultaneous_hint",
]


def edge_case_catalog_stub() -> list[str]:
    return ["paradox", "replacement", "hidden_dep", "simultaneous", "recursion"]
