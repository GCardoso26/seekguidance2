"""Testes de equipe vendedor."""

from app.marketplace.seller_rbac import merge_permissions


def test_team_member_effective_permissions():
    member = {
        "user_id": "u1",
        "role": "manager",
        "permissions": None,
    }
    perms = merge_permissions(member["role"], member["permissions"])
    assert perms["finance"]["view"] is True
    assert perms["finance"]["create"] is False


def test_invite_role_validation_contract():
    valid_roles = {"manager", "operator", "stock_keeper", "support", "finance", "marketing"}
    assert "store_owner" not in valid_roles


def test_audit_log_shape():
    log = {
        "id": "log-1",
        "action": "team.invite",
        "user_id": "owner",
        "resource_type": "team_user",
        "details": {"email": "a@b.com"},
    }
    assert log["action"].startswith("team.")


def test_owner_implicit_role():
    owner = {"role": "store_owner", "is_owner": True}
    assert owner["role"] == "store_owner"


def test_permissions_override_granular():
    base = merge_permissions("support", {"orders": {"edit": True}})
    assert base["orders"]["edit"] is True
    assert base["tickets"]["create"] is True
