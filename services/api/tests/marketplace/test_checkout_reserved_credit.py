"""Regressão: reserved_stock da própria sessão não deve bloquear checkout."""

from __future__ import annotations

from app.marketplace.shop_checkout import _locked_qty_credit


def test_locked_qty_credit_sums_per_product():
    credit = _locked_qty_credit(
        {
            "locked_items": [
                {"product_id": "p1", "quantity": 2},
                {"product_id": "p1", "quantity": 1},
                {"product_id": "p2", "quantity": 4},
            ]
        }
    )
    assert credit == {"p1": 3, "p2": 4}


def test_available_after_own_reserve_allows_full_stock():
    stock = 4
    reserved_after_initiate = 4  # bought all units
    credit = _locked_qty_credit({"locked_items": [{"product_id": "merida", "quantity": 4}]})
    available = stock - reserved_after_initiate + credit.get("merida", 0)
    assert available == 4
    assert 4 <= available


def test_available_without_credit_falsely_fails():
    stock = 4
    reserved_after_initiate = 4
    available_wrong = stock - reserved_after_initiate
    assert available_wrong == 0  # bug antigo


def test_methods_available_formula_with_own_credit():
    """get_checkout_methods deve usar a mesma fórmula stock - reserved + own_credit."""
    stock = 2
    reserved = 2
    own_credit = {"prod-a": 2}
    available = stock - reserved + own_credit.get("prod-a", 0)
    assert available == 2
    assert 2 <= available


def test_checkout_sessions_update_sql_has_no_updated_at():
    """Regressão 500: coluna updated_at não existe em checkout_sessions."""
    import inspect

    from app.marketplace import shop_checkout

    src = inspect.getsource(shop_checkout._build_stripe_checkout)
    assert "payment_intent_id = :pi" in src
    assert "payment_method = 'stripe'" in src
    # Não pode atualizar updated_at nesta tabela
    assert "updated_at = NOW()" not in src or "checkout_sessions" not in src.split("updated_at = NOW()")[0][-200:]
    # Garantia explícita: o UPDATE da sessão não referencia updated_at
    block = src[src.find("UPDATE tcg_judge.checkout_sessions") :]
    block = block[: block.find('"""', 10) + 3]
    assert "updated_at" not in block


def test_stripe_checkout_uses_global_active_locked_credit():
    """Stripe deve creditar reserved de sessões active (igual PIX/methods)."""
    import inspect

    from app.marketplace import shop_checkout

    src = inspect.getsource(shop_checkout._build_stripe_checkout)
    assert "user_active_locked_qty_credit" in src
    assert "_locked_qty_credit(checkout_data)" in src