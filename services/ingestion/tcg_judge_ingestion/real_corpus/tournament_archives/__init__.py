"""Arquivos de torneio: investigações, decks, disputas multiplayer."""

from tcg_judge_ingestion.real_corpus.tournament_archives.deck_issue_cases import deck_issue_flags
from tcg_judge_ingestion.real_corpus.tournament_archives.investigation_parser import parse_investigation_stub
from tcg_judge_ingestion.real_corpus.tournament_archives.multiplayer_disputes import dispute_severity
from tcg_judge_ingestion.real_corpus.tournament_archives.policy_case_alignment import align_policy_case_stub

__all__ = [
    "align_policy_case_stub",
    "deck_issue_flags",
    "dispute_severity",
    "parse_investigation_stub",
]
