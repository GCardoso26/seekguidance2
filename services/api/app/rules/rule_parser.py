"""Parser incremental: `rule_path` + texto curto → StructuredRule."""

from __future__ import annotations

import re

from app.rules.rule_constraints import infer_constraints
from app.rules.rule_effects import infer_state_effects, infer_zone_effects
from app.rules.rule_parser_v3 import enrich_rule_structured_v3
from app.rules.rule_semantics import build_semantics
from app.rules.structured_rules import StructuredRule


def parse_rule_path(rule_path: str | None, game_slug: str, excerpt: str | None = None) -> StructuredRule | None:
    if not rule_path:
        return None
    rid = rule_path.strip()
    rid = re.sub(r"\s+", "", rid)
    base = StructuredRule(rule_id=rid, game=game_slug, raw_excerpt=(excerpt or "")[:400] or None)
    filled = build_semantics(base)
    rt = filled.rule_type
    constraints = infer_constraints(rt)
    enr_v3 = enrich_rule_structured_v3(rid, game_slug, excerpt)
    constraints = list(constraints) + [c for c in enr_v3.get("continuous_effect_hints", []) if c]
    sem_extra: list[str] = []
    for k, vs in enr_v3.items():
        if isinstance(vs, list) and vs:
            sem_extra.append(f"parsed_v3:{k}")
    return StructuredRule(
        rule_id=filled.rule_id,
        game=game_slug,
        rule_type=rt,
        timing_window=filled.timing_window,
        precedence=list(filled.precedence),
        dependencies=[f"parent:{rid.split('.')[0]}"] if "." in rid else [],
        constraints=constraints,
        state_effects=infer_state_effects(rt),
        zone_effects=infer_zone_effects(rt),
        interaction_semantics=[f"parsed_from:{rid}", *sem_extra],
        version_label=None,
        raw_excerpt=base.raw_excerpt,
    )


def parse_hits_to_rules(hits: list, game_slug: str, *, cap: int = 12) -> list[StructuredRule]:
    out: list[StructuredRule] = []
    seen: set[str] = set()
    for h in hits[:cap]:
        rp = getattr(h, "rule_path", None)
        if not rp or rp in seen:
            continue
        seen.add(rp)
        text = getattr(h, "text", None)
        pr = parse_rule_path(rp, game_slug, excerpt=text)
        if pr:
            out.append(pr)
    return out
