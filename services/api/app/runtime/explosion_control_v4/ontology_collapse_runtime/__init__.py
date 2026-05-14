"""Colapso de ontologia em runtime."""

from __future__ import annotations

from typing import Any


def ontology_collapse_runtime_stub(ontology_nodes: int, target: int) -> dict[str, Any]:
    return {
        "ontology_nodes": ontology_nodes,
        "target": target,
        "collapsed": max(0, ontology_nodes - target),
        "assistant_notes": ["Pruning semântico preserva soft normalization entre TCGs."],
    }
