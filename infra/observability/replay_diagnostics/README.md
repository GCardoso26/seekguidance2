# Replay diagnostics (ops)

- Compare deterministic digests of replay event lists (see `replay_diagnostics_bundle` in API).
- Alert on `deterministic_mismatch` + high `branch_amplification_proxy`.

**Gap:** requires metric exporters in the API/worker processes.
