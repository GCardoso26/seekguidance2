"""Ingestion admin RBAC."""

from app.core.security.rbac import has_permission


def test_ingestion_admin_permission() -> None:
    assert has_permission("admin", "ingestion_admin")
    assert has_permission("operator", "ingestion_admin")
    assert not has_permission("viewer", "ingestion_admin")
