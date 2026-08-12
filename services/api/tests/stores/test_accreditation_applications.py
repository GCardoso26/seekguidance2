"""Unit tests for accreditation applications helpers."""

from app.stores.accreditation_applications import compute_trust_score, _checklist_for_status


def test_trust_score_increases_with_evidence():
    base = compute_trust_score({})
    richer = compute_trust_score(
        {
            "cnpj_confirmed": True,
            "store": {"site": "https://loja.example", "instagram": "@loja"},
            "evidence": {"google_business": "https://g.page/x", "photos": ["a", "b"]},
            "profile": {"tcgs": ["LORCANA", "MTG", "POKEMON"]},
            "operations": {"stock_integrated": True, "sync_method": "csv"},
        }
    )
    assert richer > base
    assert richer <= 100


def test_checklist_submitted_marks_analysis_current():
    items = _checklist_for_status("submitted")
    by_id = {i["id"]: i["state"] for i in items}
    assert by_id["company"] == "done"
    assert by_id["analysis"] == "current"
    assert by_id["approval"] == "pending"
