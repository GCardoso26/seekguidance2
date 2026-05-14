"""Chunking hierárquico para regras estilo MTG (603, 603.1, 603.3a, …)."""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field

_RULE_HEAD = re.compile(
    r"^(?P<rule>\d{3,4}(?:\.\d+)*[a-z]?)\s+(?P<rest>.+?)\s*$",
)
_SECTION_HEAD = re.compile(
    r"^(?P<rule>\d{3,4})\s+(?P<title>[A-Z][^\n]{2,120})\s*$",
)


@dataclass
class HierarchicalChunk:
    chunk_index: int
    rule_path: str | None
    parent_rule_path: str | None
    hierarchy_level: int
    title: str | None
    semantic_path: str
    text: str
    token_count: int
    content_sha256: str
    metadata: dict = field(default_factory=dict)


def parent_rule_path(rule_path: str | None) -> str | None:
    if not rule_path:
        return None
    if re.search(r"\.\d+[a-z]+$", rule_path):
        return re.sub(r"(\.\d+)[a-z]+$", r"\1", rule_path)
    if "." in rule_path:
        return re.sub(r"\.\d+$", "", rule_path)
    return None


def _hierarchy_level(rule_path: str | None) -> int:
    if not rule_path:
        return 0
    return rule_path.count(".") + (1 if re.search(r"[a-z]$", rule_path) else 0)


def _semantic_path(stack: list[tuple[str | None, str]]) -> str:
    parts = [p[1] for p in stack if p[1]]
    return " > ".join(parts[-8:])


def _approx_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def chunk_mtg_hierarchical(raw_text: str, *, document_title: str) -> list[HierarchicalChunk]:
    lines = raw_text.splitlines()
    chunks: list[HierarchicalChunk] = []
    stack: list[tuple[str | None, str]] = [(None, document_title)]
    current_rule: str | None = None
    current_title: str | None = document_title
    body_lines: list[str] = []
    chunk_index = 0

    def flush() -> None:
        nonlocal chunk_index, body_lines, current_rule, current_title
        body = "\n".join(body_lines).strip()
        body_lines = []
        if not body and current_rule is None:
            return
        text_block = body
        if current_rule:
            head = f"{current_rule} {current_title}".strip() if current_title else current_rule
            text_block = f"{head}\n{body}".strip()
        if not text_block:
            return
        pr = parent_rule_path(current_rule) if current_rule else None
        sem = _semantic_path(stack + [(current_rule, (current_title or "").strip())])
        sha = hashlib.sha256(text_block.encode("utf-8")).hexdigest()
        idx = chunk_index
        chunks.append(
            HierarchicalChunk(
                chunk_index=idx,
                rule_path=current_rule,
                parent_rule_path=pr,
                hierarchy_level=_hierarchy_level(current_rule),
                title=current_title,
                semantic_path=sem,
                text=text_block,
                token_count=_approx_tokens(text_block),
                content_sha256=sha,
                metadata={"document_title": document_title},
            )
        )
        chunk_index += 1

    for line in lines:
        stripped = line.strip()
        if not stripped:
            body_lines.append("")
            continue
        m_sec = _SECTION_HEAD.match(stripped)
        m_rule = None if m_sec else _RULE_HEAD.match(stripped)
        if m_sec and "." not in m_sec.group("rule"):
            flush()
            num = m_sec.group("rule")
            title = m_sec.group("title").strip()
            current_rule = num
            current_title = title
            stack = [(None, document_title), (num, title)]
            body_lines = []
            continue
        if m_rule:
            flush()
            num = m_rule.group("rule")
            rest = m_rule.group("rest").strip()
            current_rule = num
            current_title = rest[:240] if rest else None
            parts = num.split(".")
            stack = [(None, document_title)]
            acc: list[str] = []
            for p in parts:
                acc.append(p)
                rp = ".".join(acc)
                lbl = rest if rp == num else rp
                stack.append((rp, lbl))
            body_lines = []
            continue
        body_lines.append(line)

    flush()

    if not chunks and raw_text.strip():
        t = raw_text.strip()[:120_000]
        chunks.append(
            HierarchicalChunk(
                chunk_index=0,
                rule_path=None,
                parent_rule_path=None,
                hierarchy_level=0,
                title=document_title,
                semantic_path=document_title,
                text=t,
                token_count=_approx_tokens(t),
                content_sha256=hashlib.sha256(t.encode("utf-8")).hexdigest(),
                metadata={"document_title": document_title, "fallback": True},
            )
        )
    elif len(chunks) == 1 and chunks[0].rule_path is None:
        chunks[0].metadata["fallback"] = True
    return chunks
