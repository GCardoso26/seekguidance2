from pathlib import Path

import pytest


def test_typescript_contracts_file_exists() -> None:
    root = Path(__file__).resolve().parents[4]
    p = root / "apps" / "mobile" / "shared_contracts" / "typescript_contracts" / "judge_mobile.ts"
    if not p.is_file():
        pytest.skip("judge_mobile.ts ausente neste checkout")
    text = p.read_text(encoding="utf-8")
    assert "JudgeMobileCorePayload" in text
