"""Compilador semântico v4: texto -> AST -> semântica -> IR-like."""

from __future__ import annotations

from typing import Any

from app.rules.semantic_compiler.dependency_inference import infer_dependencies
from app.rules.semantic_compiler.effect_semantic_builder import build_semantic_effects
from app.rules.semantic_compiler.rule_ast_builder import build_rule_ast
from app.rules.semantic_compiler.semantic_constraint_extractor import extract_constraints
from app.rules.semantic_compiler.semantic_normalizer import normalize_semantics
from app.rules.semantic_compiler.semantic_parser import parse_semantic_text
from app.rules.semantic_compiler.timing_semantic_extractor import extract_timing_semantics


def compile_rule_text(rule_id: str, text: str) -> dict[str, Any]:
    parsed = parse_semantic_text(rule_id, text)
    normalized = normalize_semantics(parsed)
    ast = build_rule_ast(normalized)
    tokens = list(normalized.get("tokens", []))
    constraints = extract_constraints(tokens)
    timing = extract_timing_semantics(tokens)
    deps = infer_dependencies(tokens)
    effects = build_semantic_effects(tokens)
    return {
        "rule_id": rule_id,
        "rule_ast_generated": True,
        "semantic_ast": ast,
        "semantic_constraints": constraints,
        "timing_semantics": timing,
        "implicit_dependencies": deps,
        "semantic_effects": effects,
        "runtime_annotations": [f"hook::{x}" for x in timing[:4]],
    }
