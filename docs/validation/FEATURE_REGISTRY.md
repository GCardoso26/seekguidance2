# FEATURE_REGISTRY.md

Inventory of **what exists vs what feels finished**. Additive platforms from BP1–3.5 included.

| Feature | Exists | Wired to core UX | Trustworthy? | Notes |
|---------|:------:|:----------------:|:------------:|-------|
| Supabase signup/login `/entrar` | ✅ | ✅ | ⚠️ | Broken CTAs to `/login` |
| Marketplace browse/search | ✅ | ✅ | ⚠️ | Perf + analytics debt |
| Cart / checkout | ✅ | ✅ | ⚠️ | 401 empty; drawer scope |
| Favorites / compare | ✅ | ⚠️ | ⚠️ | Analytics ghosts |
| Seller store create | ✅ | ✅ | ⚠️ | Guest UX |
| Seller CSV import | ✅ | ✅ | ✅/⚠️ | Security upload TBD |
| Seller analytics / Top Movers | ✅ | ⚠️ | ⚠️ | Dead compare emit |
| Events UI shells | ✅ | ⚠️ | ❌ | Soft-open / IDOR |
| Tournament ops | ✅ | ⚠️ | ❌ | Authz |
| Identity platform APIs | ✅ | ⚠️ | ⚠️ | Dual with Supabase |
| Financial platform `fin_*` | ✅ | ❌ checkout | ❌ | Demo |
| Identity wallet | ✅ | ❌ / parallel | ❌ | Dual |
| Sandbox + seeder | ✅ | ✅ DX | ❌ misconfig | Allowlist |
| APP_MODE / feature flags | ✅ | ✅ | ⚠️ | Fail-open |
| Event Registry (marketplace) | ✅ | ⚠️ | ⚠️ | SEA-02 |
| Event Registry (BP2/3 emit) | ⚠️ claimed | ❌ | ❌ | logger only |
| Admin health dashboards | ✅ | ⚠️ | ⚠️ | subject scoping |

## Marketing risk

Do not claim: live wallet checkout, tournament PermissionService-complete, analytics-complete platforms, Perf 97 on cold search — until backlog closed.
