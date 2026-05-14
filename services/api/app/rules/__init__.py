"""Regras estruturadas (parser + registo)."""

from app.rules.rule_parser import parse_rule_path
from app.rules.rule_registry import get_structured_rules
from app.rules.structured_rules import StructuredRule

__all__ = ["StructuredRule", "get_structured_rules", "parse_rule_path"]
