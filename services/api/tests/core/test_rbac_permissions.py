"""Testes RBAC granular do painel lojista."""

from app.marketplace.seller_rbac import (
    ROLE_DEFAULTS,
    VALID_ROLES,
    has_store_permission,
    merge_permissions,
)


def test_valid_roles_include_granular_set():
    assert "store_owner" in VALID_ROLES
    assert "manager" in VALID_ROLES
    assert "operator" in VALID_ROLES
    assert "stock_keeper" in VALID_ROLES
    assert "support" in VALID_ROLES
    assert "finance" in VALID_ROLES
    assert "marketing" in VALID_ROLES


def test_store_owner_has_all_permissions():
    assert has_store_permission("store_owner", None, "finance", "export")
    assert has_store_permission("store_owner", None, "team", "delete")


def test_manager_finance_view_export_only():
    assert has_store_permission("manager", None, "finance", "view")
    assert has_store_permission("manager", None, "finance", "export")
    assert not has_store_permission("manager", None, "finance", "create")


def test_operator_no_finance():
    assert not has_store_permission("operator", None, "finance", "view")
    assert has_store_permission("operator", None, "orders", "edit")


def test_support_tickets_full_crud_except_delete():
    assert has_store_permission("support", None, "tickets", "create")
    assert has_store_permission("support", None, "tickets", "edit")
    assert not has_store_permission("support", None, "tickets", "delete")


def test_merge_permissions_override():
    merged = merge_permissions("operator", {"finance": {"view": True}})
    assert merged["finance"]["view"] is True
    assert merged["orders"]["edit"] is True


def test_marketing_coupons_module():
    assert has_store_permission("marketing", None, "marketing", "create")
    assert has_store_permission("marketing", None, "catalog", "view")


def test_role_defaults_matrix_shape():
    for role in VALID_ROLES:
        matrix = ROLE_DEFAULTS[role]
        assert "orders" in matrix
        assert "view" in matrix["orders"]
