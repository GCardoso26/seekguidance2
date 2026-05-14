# Judge Replay — UX foundation (incremental)

Stubs for future overlays (no MVP breakage):

- Timeline overlays: bind to `replay_id` + trace correlation (`app.observability.runtime_tracing`).
- Branch comparison: consume `app.runtime.replay_stability` compaction metadata.
- Semantic diff: read-only diff from evaluation continuous V2, not inline in MVP HTML.

**Gap:** `replay.html` remains minimal; this file defines extension hooks only.
