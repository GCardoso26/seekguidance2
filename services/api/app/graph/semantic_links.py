"""Mapa curado de vizinhança entre cabeçalhos de regra (número principal CR)."""

from __future__ import annotations

# Cabeçalho numérico (ex.: "704") -> outros cabeçalhos frequentemente úteis em interações
RULE_NEIGHBOR_HEADS: dict[str, tuple[str, ...]] = {
    "614": ("704", "117", "122", "305"),  # replacement / SBAs / priority / turn structure
    "704": ("117", "122", "305", "500", "514"),  # SBAs / priority / turn / timing / effects
    "117": ("704", "500", "514", "305"),
    "305": ("500", "514", "117"),
    "603": ("704", "117", "405", "502"),  # triggered / stack / combat / priority
    "502": ("117", "514", "500", "305"),
    "613": ("614", "704", "611"),
    "611": ("613", "704", "306"),
}


def rule_numeric_head(rule_path: str | None) -> str | None:
    if not rule_path:
        return None
    head = rule_path.strip().split(".", 1)[0]
    return head if head.isdigit() else None


def neighbor_heads_for_paths(rule_paths: list[str | None]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for rp in rule_paths:
        h = rule_numeric_head(rp)
        if not h:
            continue
        for n in RULE_NEIGHBOR_HEADS.get(h, ()):
            if n not in seen:
                seen.add(n)
                out.append(n)
    return out
