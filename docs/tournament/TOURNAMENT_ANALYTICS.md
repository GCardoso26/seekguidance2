# TOURNAMENT_ANALYTICS.md

Marts (never query ops tables in dashboards long-term):

`mart_events`, `mart_tournaments`, `mart_players`, `mart_checkins`, `mart_pairings`, `mart_matches`, `mart_prizes`, `mart_judges`, `mart_penalties`, `mart_tournament_health`.

Readers: `AnalyticsMartService` (outside `analytics_runtime`).
