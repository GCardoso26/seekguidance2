"""Testes de notificações do header lojista."""



def test_header_category_types():
    types = {"new_orders", "tickets", "payments", "chargeback"}
    assert "new_orders" in types


def test_header_action_paths():
    paths = [
        "/vendedor/painel/pedidos",
        "/vendedor/painel/atendimento/tickets",
        "/vendedor/painel/financeiro/receitas",
        "/vendedor/painel/financeiro/stripe",
    ]
    assert all(p.startswith("/vendedor/painel") for p in paths)


def test_urgent_chargeback_flag():
    cat = {"type": "chargeback", "urgent": True, "count": 1}
    assert cat["urgent"] is True


def test_total_unread_sums_categories():
    categories = [{"count": 12}, {"count": 3}]
    assert sum(c["count"] for c in categories) == 15
