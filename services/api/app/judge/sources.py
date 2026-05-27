"""Formatação de fontes Judge para a UI."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlparse, urlunparse

from pydantic import BaseModel


class JudgeSource(BaseModel):
    title: str
    url: str
    section: str | None = None
    excerpt: str | None = None
    rule_path: str | None = None
    page_number: int | None = None
    chunk_id: str | None = None


_TITLE_PT: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"comprehensive rules", re.I), "Regras Abrangentes (Comprehensive Rules)"),
    (re.compile(r"tournament rules", re.I), "Regras de Torneio"),
    (re.compile(r"infraction procedure", re.I), "Procedimentos de Infração (IPG)"),
]


def _title_for_display(raw: str) -> str:
    title = (raw or "").strip() or "Fonte oficial"
    if title.lower() in ("source", "document"):
        return "Fonte oficial"
    for pattern, label in _TITLE_PT:
        if pattern.search(title):
            return pattern.sub(label, title, count=1)
    return title


def _section_for_display(section: str | None, rule_path: str | None) -> str | None:
    raw = (section or rule_path or "").strip()
    if not raw:
        return None
    if re.match(r"^\d", raw) and not raw.lower().startswith("sec"):
        return f"Secção {raw}"
    return raw


def _page_number_from_citation(c: Any) -> int | None:
    page = getattr(c, "page_number", None)
    if isinstance(page, int):
        return page
    if isinstance(page, str) and page.isdigit():
        return int(page)
    return None


def _chunk_id_from_citation(c: Any) -> str | None:
    chunk_hash = getattr(c, "chunk_content_sha256", None)
    if chunk_hash:
        return str(chunk_hash)[:16]
    return None


def url_with_page_anchor(url: str, page_number: int | None) -> str:
    if not url or page_number is None:
        return url or ""
    if "#page=" in url or "#page" in url.lower():
        return url
    parsed = urlparse(url)
    if parsed.scheme in ("http", "https"):
        return f"{url}#page={page_number}"
    return url


def sources_from_citations(citations: list[Any], *, max_sources: int = 8) -> list[JudgeSource]:
    out: list[JudgeSource] = []
    for c in citations[:max_sources]:
        raw_title = getattr(c, "document_title", "") or ""
        rule_path = getattr(c, "rule_path", None) or None
        section_raw = getattr(c, "section_path", None) or rule_path
        page_number = _page_number_from_citation(c)
        base_url = getattr(c, "source_url", "") or ""

        out.append(
            JudgeSource(
                title=_title_for_display(raw_title),
                url=url_with_page_anchor(base_url, page_number),
                section=_section_for_display(
                    str(section_raw) if section_raw else None,
                    str(rule_path) if rule_path else None,
                ),
                excerpt=(getattr(c, "excerpt", None) or "")[:280] or None,
                rule_path=str(rule_path).strip() if rule_path else None,
                page_number=page_number,
                chunk_id=_chunk_id_from_citation(c),
            )
        )
    return out
