"""Fragmentos SQL e validação para retrieval versionado (as_of)."""

from __future__ import annotations

import re
from datetime import date

_ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_as_of_date(value: str | None) -> date | None:
    if not value or not _ISO.match(value.strip()):
        return None
    try:
        y, m, d = (int(x) for x in value.strip().split("-"))
        return date(y, m, d)
    except ValueError:
        return None


def temporal_sql_filter(*, as_of: str | None, prefer_historical: bool) -> tuple[str, dict[str, object]]:
    """
    Filtro por janela de vigência em `document_versions`.
    - `as_of`: inclui apenas documentos com versão ativa na data.
    - `prefer_historical` sem `as_of`: favorece corpus com versões já encerradas (effective_to preenchido).
    """
    params: dict[str, object] = {}
    if parse_as_of_date(as_of) is not None:
        params["as_of"] = as_of.strip()
        clause = """
          AND EXISTS (
            SELECT 1 FROM tcg_judge.document_versions dv
            WHERE dv.document_id = d.id
              AND dv.effective_from IS NOT NULL
              AND dv.effective_from <= CAST(:as_of AS date)
              AND (dv.effective_to IS NULL OR dv.effective_to > CAST(:as_of AS date))
          )
        """
        return clause, params
    if prefer_historical:
        clause = """
          AND EXISTS (
            SELECT 1 FROM tcg_judge.document_versions dv
            WHERE dv.document_id = d.id
              AND dv.effective_to IS NOT NULL
          )
        """
        return clause, params
    return "", params
