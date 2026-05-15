"""replay_operational_trust_engine_v1 — replay operational trust."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.runtime.replay_certification.replay_certification_engine_v2 import certify_replay_v2

TRUST_DIR = Path("generated/runtime_artifacts/trust")


def _write(path: Path, body: dict[str, Any]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(body, indent=2, sort_keys=True) + "\n"
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(text.encode()).hexdigest()


def build_replay_trust(replay_ref: str) -> dict[str, Any]:
    cert = certify_replay_v2(replay_ref)
    chain = hashlib.sha256(
        json.dumps({"ref": replay_ref, "cert": cert["certification_score"]}, sort_keys=True).encode()
    ).hexdigest()
    trust_score = (cert["certification_score"] + cert["reproducibility_score"]) / 2.0
    summary = {"replay_ref": replay_ref, "trust_score": trust_score, "chain": chain}
    integrity = {"integrity_score": cert.get("certification_score", 0.9)}
    replay = {"reproducibility": cert.get("reproducibility_score", 0.9)}
    audit = {"audit_trail": cert.get("audit_trail", {})}
    _write(TRUST_DIR / "runtime.trust.summary.json", summary)
    _write(TRUST_DIR / "runtime.trust.integrity.json", integrity)
    _write(TRUST_DIR / "runtime.trust.replay.json", replay)
    _write(TRUST_DIR / "runtime.trust.audit.json", audit)
    return {**cert, "trust_score": trust_score, "chain": chain, "summary": summary}


def replay_operational_trust_engine_v1_stub(
    replay_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = build_replay_trust(replay_ref)
    return {
        "scope": replay_ref,
        "storage_path": storage_path or str(TRUST_DIR),
        "assistant_notes": ["replay_operational_trust_engine_v1: replay trust platform."],
        "deterministic_alignment": {"token": report["chain"][:20]},
        "runtime_confidence": report["trust_score"],
        "replay_summary": report.get("audit_trail", {}),
        "lineage_summary": report.get("summary", {}),
        "divergence_summary": {"divergence": report.get("divergence_score", 0)},
        "governance_summary": report["summary"],
        "lifecycle_summary": {},
        "operational_notes": ["trust_artifacts_written"],
        "trust_score": report["trust_score"],
    }
