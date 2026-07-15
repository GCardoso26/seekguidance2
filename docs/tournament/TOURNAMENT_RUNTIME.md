# TOURNAMENT_RUNTIME.md

Read APIs:

| Path | Purpose |
|------|---------|
| GET /runtime/events | List store events |
| GET /runtime/event-dashboard | Event KPIs |
| GET /runtime/player-dashboard | Player view |
| GET /runtime/judge-dashboard | Judge ops |
| GET /runtime/standings | Standings |
| GET /runtime/pairings | Pairings |
| GET /runtime/checkins | Check-ins |
| GET /runtime/tournament-health | Health score |
| GET /runtime/store-event-dashboard | Store KPIs |

Canonical writes: `/runtime/judge/tournament-platform/*`.

Performance: RSC-first FE shells; marts; no aggressive polling; SSE/WS future via RC1 timers.
