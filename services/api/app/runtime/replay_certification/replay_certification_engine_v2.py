"""replay_certification_engine_v2 — certificação production v2."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.runtime.replay_certification.replay_determinism_certification_v1 import certify_replay

CERT_DIR = Path("generated/runtime_artifacts/certification")


def _write(path: Path, body: dict[str, Any]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(body, indent=2, sort_keys=True) + "\n"
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(text.encode()).hexdigest()


def certify_replay_v2(replay_ref: str) -> dict[str, Any]:
    base = certify_replay(replay_ref)
    chain = hashlib.sha256(
        json.dumps({"ref": replay_ref, "cert": base["certification_score"]}, sort_keys=True).encode()
    ).hexdigest()
    summary = {
        "replay_ref": replay_ref,
        "certification_score": base["certification_score"],
        "chain_hash": chain,
    }
    hashes = {"replay_ref": replay_ref, "hashes": []}
    repro = {
        "replay_ref": replay_ref,
        "reproducibility_score": base["reproducibility_score"],
    }
    audit = {"replay_ref": replay_ref, "audit_trail": base.get("audit_trail", {})}
    hashes["hashes"] = [
        _write(CERT_DIR / "runtime.certification.summary.json", summary),
        _write(CERT_DIR / "runtime.certification.hashes.json", hashes),
        _write(CERT_DIR / "runtime.certification.reproducibility.json", repro),
        _write(CERT_DIR / "runtime.certification.audit.json", audit),
    ]
    return {**base, "summary": summary, "artifacts": hashes}


def replay_certification_engine_v2_stub(
    replay_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = certify_replay_v2(replay_ref)
    return {
        "scope": replay_ref,
        "storage_path": storage_path or str(CERT_DIR),
        "assistant_notes": ["replay_certification_engine_v2: certification platform."],
        "deterministic_alignment": {"token": report["summary"]["chain_hash"][:20]},
        "runtime_confidence": report["certification_score"],
        "replay_summary": report.get("audit_trail", {}),
        "lineage_summary": report.get("artifacts", {}),
        "divergence_summary": {"score": report.get("divergence_score", 0)},
        "governance_summary": report["summary"],
        "lifecycle_summary": {},
        "operational_notes": ["certified_v2"],
        "certification_score": report["certification_score"],
        "reproducibility_score": report["reproducibility_score"],
    }
