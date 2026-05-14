"""Motor de estado simbólico."""

from app.reasoning.state_engine.state_transition_engine import evolve_along_roles, initial_symbolic_state
from app.reasoning.state_engine.symbolic_state import SymbolicGameState

__all__ = ["SymbolicGameState", "evolve_along_roles", "initial_symbolic_state"]
