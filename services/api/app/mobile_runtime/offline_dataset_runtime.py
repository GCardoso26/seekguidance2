"""Dataset leve offline (perfil compacto) — stub."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def offline_dataset_runtime_stub(profile: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"profile": profile, "rows": 200, "compacted": True},
        sync_hints=["Trocar perfil completo apenas em Wi‑Fi.", "Checksum antes de aplicar patch."],
        deterministic_alignment={"manifest_token": f"ods-{profile}"},
        mobile_constraints={"storage_soft_cap_mb": 128},
        offline_confidence=0.6,
        assistant_notes=["Dataset offline é subconjunto; lineage completo pode estar na cloud."],
        lineage_replay_slice=f"dataset-{profile}",
    )
