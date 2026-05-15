"""replay_certification_engine_v3 — certification v3 artifacts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.runtime.replay_certification.replay_certification_engine_v2 import certify_replay_v2

CERT_V3 = Path("generated/runtime_artifacts/certification_v3")


def _write(path: Path, body: dict[str, Any]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(body, indent=2, sort_keys=True) + "\n"
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(text.encode()).hexdigest()


def replay_certification_engine_v3(replay_ref: str) -> dict[str, Any]:
    base = certify_replay_v2(replay_ref)
    reliability = {"score": base.get("certification_score", 0.9)}
    summary = {
        "replay_ref": replay_ref,
        "certification_score": base["certification_score"],
        "integrity_status": "ok" if base["certification_score"] > 0.85 else "review",
    }
    _write(CERT_V3 / "runtime.certification.summary.json", summary)
    _write(CERT_V3 / "runtime.certification.hashes.json", {"ref": replay_ref, "chain": base.get("chain", "")})
    _write(CERT_V3 / "runtime.certification.audit.json", base.get("audit_trail", {}))
    _write(CERT_V3 / "runtime.certification.reliability.json", reliability)
    _write(
        CERT_V3 / "runtime.certification.reproducibility.json",
        {"score": base.get("reproducibility_score", 0.9)},
    )
    return {
        **base,
        "summary": summary,
        "integrity_status": summary["integrity_status"],
        "runtime_confidence": base["certification_score"],
    }


def replay_certification_engine_v3_stub(
    replay_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = replay_certification_engine_v3(replay_ref)
    return {
        "scope": replay_ref,
        "storage_path": storage_path or str(CERT_V3),
        "assistant_notes": ["replay_certification_engine_v3: certification v3."],
        "deterministic_alignment": {"token": f"cert3-{replay_ref}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": report.get("audit_trail", {}),
        "lineage_summary": report.get("summary", {}),
        "divergence_summary": {},
        "governance_summary": report["summary"],
        "lifecycle_summary": {},
        "operational_notes": ["certification_v3_written"],
        "integrity_status": report["integrity_status"],
        "certification_score": report["certification_score"],
    }
