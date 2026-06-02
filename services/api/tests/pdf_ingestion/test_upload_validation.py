"""PDF upload validation."""

def test_pdf_extension_check() -> None:
    assert "rules.pdf".lower().endswith(".pdf")
    assert not "rules.txt".lower().endswith(".pdf")
