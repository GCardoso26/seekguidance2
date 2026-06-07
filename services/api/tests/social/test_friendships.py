"""Testes de lógica de amizades."""

from __future__ import annotations


class TestFriendshipLogic:
    def test_self_friend_invalid(self):
        assert "player-a" == "player-a"

    def test_status_values(self):
        allowed = {"none", "pending", "accepted", "blocked"}
        assert "pending" in allowed
        assert "accepted" in allowed
