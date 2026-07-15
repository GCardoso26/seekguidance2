# EVENT_DOMAIN.md

`StoreEvent` belongs to a Store.

Fields: name, description, game, format, category, type, capacity, dates, venue, status, visibility, image/banner, organizer, rules, policies.

Table: `tcg_judge.store_events`.

Lazy bootstrap: `EventService.ensure_from_tournament` creates a 1:1 shell without SQL fake rows.
