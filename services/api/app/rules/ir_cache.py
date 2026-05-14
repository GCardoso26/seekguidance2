"""Cache determinístico de IR compilado + invalidação por versão."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app.rules.compiler.compiler_pipeline import compile_rule_dict
from app.rules.ir.rule_ir_models import RuleIRDocument


def _stable_hash(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class IRCompilerCache:
    """Snapshots versionadas de RuleIRDocument serializado."""

    def __init__(self, *, ir_schema_version: str = "1.0") -> None:
        self.ir_schema_version = ir_schema_version
        self._store: dict[str, dict[str, Any]] = {}

    def invalidate_rule(self, rule_id: str) -> None:
        keys = [k for k in self._store if k.startswith(f"{rule_id}::")]
        for k in keys:
            del self._store[k]

    def invalidate_all(self) -> None:
        self._store.clear()

    def compile_key(self, rule_dict: dict[str, Any]) -> RuleIRDocument:
        rid = str(rule_dict.get("rule_id", "unknown"))
        h = _stable_hash({**rule_dict, "_ir_schema": self.ir_schema_version})
        key = f"{rid}::{h}"
        if key not in self._store:
            doc = compile_rule_dict(rule_dict)
            doc.metadata.setdefault("cache_key", key)
            doc.metadata["compiler_cache_hit"] = False
            self._store[key] = doc.to_dict()
            return doc
        cached = dict(self._store[key])
        meta = dict(cached.get("metadata") or {})
        meta["compiler_cache_hit"] = True
        return RuleIRDocument(
            rule_id=cached["rule_id"],
            rule_type=cached["rule_type"],
            ir_version=cached.get("ir_version", "1.0"),
            conditions=list(cached.get("conditions") or []),
            timing_windows=list(cached.get("timing_windows") or []),
            precedence_constraints=list(cached.get("precedence_constraints") or []),
            mutations=list(cached.get("mutations") or []),
            continuous_effects=list(cached.get("continuous_effects") or []),
            dependencies=list(cached.get("dependencies") or []),
            state_requirements=list(cached.get("state_requirements") or []),
            generated_events=list(cached.get("generated_events") or []),
            metadata=meta,
        )

    def snapshot_stats(self) -> dict[str, Any]:
        return {"entries": len(self._store), "ir_schema_version": self.ir_schema_version}


_global_ir_cache: IRCompilerCache | None = None


def get_ir_compiler_cache() -> IRCompilerCache:
    global _global_ir_cache
    if _global_ir_cache is None:
        _global_ir_cache = IRCompilerCache()
    return _global_ir_cache
