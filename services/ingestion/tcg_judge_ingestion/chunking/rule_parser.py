"""
Parser de estrutura hierárquica para documentos de regras TCG.

Delega MTG ao chunker existente; outros jogos usam padrão genérico ou fallback por parágrafo.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from tcg_judge_ingestion.chunker.hierarchical_mtg import HierarchicalChunk, chunk_mtg_hierarchical

MTG_RULE_RE = re.compile(
    r"^(?P<number>\d{3,4}(?:\.\d+[a-z]?)?)\s+(?P<text>.+)",
    re.MULTILINE,
)

GENERIC_RULE_RE = re.compile(
    r"^(?:(?:Artigo|Seção|Section|Article|Chapter|Rule)\s+)?"
    r"(?P<number>\d+(?:[.\-]\d+)+[a-z]?)\s*[.:\-]?\s+(?P<text>.+)",
    re.MULTILINE | re.IGNORECASE,
)

SECTION_TITLE_RE = re.compile(
    r"^(?P<number>\d+)\.\s+(?P<title>[A-Z][A-Z\s]+)$",
    re.MULTILINE,
)


@dataclass
class RuleChunk:
    content: str
    rule_atom: Optional[str] = None
    rule_section: Optional[str] = None
    rule_subsection: Optional[str] = None
    rule_depth: int = 0
    rule_title: Optional[str] = None
    parent_atom: Optional[str] = None
    metadata: dict = field(default_factory=dict)


def _parse_mtg_number(number: str) -> Tuple[str, str, str, int]:
    parts = re.split(r"[.]", number)
    section = parts[0]
    if len(parts) == 1:
        return section, section, section, 0
    subsection = f"{parts[0]}.{re.sub(r'[a-z]$', '', parts[1])}"
    depth = 1 if not re.search(r"[a-z]$", number) else 2
    return section, subsection, number, depth


def _parse_generic_number(number: str) -> Tuple[str, str, str, int]:
    clean = re.sub(r"[^0-9.]", ".", number).strip(".")
    parts = [p for p in clean.split(".") if p]
    depth = min(len(parts) - 1, 3) if len(parts) > 1 else 0
    section = parts[0] if parts else number
    subsection = ".".join(parts[:2]) if len(parts) >= 2 else section
    return section, subsection, number, depth


def _hierarchical_to_rule_chunks(chunks: list[HierarchicalChunk]) -> List[RuleChunk]:
    out: List[RuleChunk] = []
    for ch in chunks:
        atom = ch.rule_path
        section, subsection, _, depth = (
            _parse_mtg_number(atom) if atom and re.match(r"^\d", atom) else (None, None, atom, ch.hierarchy_level)
        )
        if atom and not section:
            section, subsection, _, depth = _parse_generic_number(atom)
        out.append(
            RuleChunk(
                content=ch.text,
                rule_atom=atom,
                rule_section=section,
                rule_subsection=subsection,
                rule_depth=depth if atom else ch.hierarchy_level,
                rule_title=ch.title,
                parent_atom=ch.parent_rule_path,
                metadata=dict(ch.metadata),
            )
        )
    return out


def chunk_by_rule_hierarchy(
    text: str,
    game_slug: str,
    min_chunk_chars: int = 100,
    max_chunk_chars: int = 1200,
) -> List[RuleChunk]:
    if game_slug == "mtg":
        return _hierarchical_to_rule_chunks(
            chunk_mtg_hierarchical(text, document_title=game_slug)
        )

    rule_re = GENERIC_RULE_RE
    parse_number = _parse_generic_number
    matches = list(rule_re.finditer(text))
    if len(matches) < 5:
        return _chunk_by_paragraph(text, max_chunk_chars)

    chunks: List[RuleChunk] = []
    current_section_title: Optional[str] = None

    for i, match in enumerate(matches):
        number = match.group("number")
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        content = text[start:end].strip()
        section, subsection, atom, depth = parse_number(number)
        if depth == 0:
            title_match = SECTION_TITLE_RE.match(content.split("\n")[0])
            if title_match:
                current_section_title = title_match.group("title").title()
        chunks.append(
            RuleChunk(
                content=content[:max_chunk_chars],
                rule_atom=atom,
                rule_section=section,
                rule_subsection=subsection,
                rule_depth=depth,
                rule_title=current_section_title,
                parent_atom=subsection if depth == 2 else (section if depth == 1 else None),
            )
        )

    return _merge_short_chunks(chunks, min_chunk_chars)


def _chunk_by_paragraph(text: str, max_chars: int) -> List[RuleChunk]:
    paragraphs = [p.strip() for p in re.split(r"\n\n+", text) if p.strip()]
    chunks: List[RuleChunk] = []
    buffer = ""
    for i, para in enumerate(paragraphs):
        if len(buffer) + len(para) > max_chars and buffer:
            chunks.append(RuleChunk(content=buffer.strip()))
            buffer = (paragraphs[i - 1] + "\n\n") if i > 0 else ""
        buffer += para + "\n\n"
    if buffer.strip():
        chunks.append(RuleChunk(content=buffer.strip()))
    return chunks


def _merge_short_chunks(chunks: List[RuleChunk], min_chars: int) -> List[RuleChunk]:
    if not chunks:
        return chunks
    result = [chunks[0]]
    for chunk in chunks[1:]:
        prev = result[-1]
        same_parent = prev.rule_subsection == chunk.rule_subsection
        if len(prev.content) < min_chars and same_parent:
            result[-1] = RuleChunk(
                content=prev.content + "\n" + chunk.content,
                rule_atom=chunk.rule_atom,
                rule_section=prev.rule_section,
                rule_subsection=prev.rule_subsection,
                rule_depth=prev.rule_depth,
                rule_title=prev.rule_title,
                parent_atom=prev.parent_atom,
            )
        else:
            result.append(chunk)
    return result


def rule_chunks_to_hierarchical(
    rule_chunks: List[RuleChunk],
    *,
    document_title: str,
) -> list[HierarchicalChunk]:
    """Converte RuleChunk → HierarchicalChunk para persistência existente."""
    out: list[HierarchicalChunk] = []
    for i, rc in enumerate(rule_chunks):
        atom = rc.rule_atom
        sha = hashlib.sha256(rc.content.encode("utf-8")).hexdigest()
        out.append(
            HierarchicalChunk(
                chunk_index=i,
                rule_path=atom,
                parent_rule_path=rc.parent_atom,
                hierarchy_level=rc.rule_depth,
                title=rc.rule_title,
                semantic_path=rc.rule_subsection or document_title,
                text=rc.content,
                token_count=max(1, len(rc.content) // 4),
                content_sha256=sha,
                metadata={
                    **rc.metadata,
                    "rule_section": rc.rule_section,
                    "rule_subsection": rc.rule_subsection,
                    "rule_atom": rc.rule_atom,
                    "rule_depth": rc.rule_depth,
                },
            )
        )
    return out
