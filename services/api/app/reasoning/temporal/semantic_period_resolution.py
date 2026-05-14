"""Resolução de período semântico."""

from __future__ import annotations


def resolve_period(question: str) -> str:
    q = (question or "").lower()
    for year in ["1999", "2004", "2009", "2010", "2014", "2020"]:
        if year in q:
            return year
    if "modern" in q:
        return "modern"
    return "current"
