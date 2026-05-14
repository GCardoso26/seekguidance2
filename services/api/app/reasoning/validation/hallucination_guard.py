"""Heurísticas anti-alucinação: passos sem suporte nos trechos recuperados."""

from __future__ import annotations

from app.retrieval.types import ChunkHit


def unsupported_steps(
    interaction_chain: list[str],
    hits: list[ChunkHit],
) -> list[str]:
    if not hits:
        return ["no_retrieved_chunks"]
    blob = " ".join((h.text or "").lower() for h in hits[:20])
    paths = " ".join((h.rule_path or "").lower() for h in hits[:20])
    out: list[str] = []
    for line in interaction_chain:
        key = line.lower()
        if "replacement" in key and "replacement" not in blob and "instead" not in blob and "614" not in paths:
            out.append("replacement_step_weakly_supported")
        if "state-based" in key and "704" not in blob and "704" not in paths and "state-based" not in blob:
            out.append("sba_step_weakly_supported")
    return out
