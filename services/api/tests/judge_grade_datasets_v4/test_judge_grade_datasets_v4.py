import json
from pathlib import Path


def test_judge_grade_v4_manifest_schema_present() -> None:
    root = Path(__file__).resolve().parents[2]
    manifest = root / "evaluation" / "judge_grade_datasets_v4" / "manifests" / "stub_v4.json"
    schema = root / "evaluation" / "judge_grade_datasets_v4" / "schemas" / "dataset_manifest_v4.schema.json"
    assert manifest.is_file()
    assert schema.is_file()
    data = json.loads(manifest.read_text(encoding="utf-8"))
    assert data["dataset_id"]
