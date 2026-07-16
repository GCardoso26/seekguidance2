# ADMIN_SANDBOX.md

**Program:** Business Program 3.5

## APP_MODE

| Mode | Sandbox elevation | seed_demo |
|------|-------------------|-----------|
| production | never | blocked |
| beta | never | only if `SEED_DEMO_FORCE=1` |
| sandbox | yes (allowlist) | yes |
| development | yes (allowlist or any authed if empty) | yes |

Env:

- API: `APP_MODE`, `SANDBOX_ADMIN_EMAILS` (CSV), `SEED_DEMO_FORCE`
- FE: `NEXT_PUBLIC_APP_MODE`

## Admin login

Use a real Supabase user whose email is in `SANDBOX_ADMIN_EMAILS`.  
Status: `GET /runtime/judge/sandbox/status` (via `/api/sandbox/status`).

Elevated users get SUPER_ADMIN permissions via `PermissionService` early-return and all seller plan features on the FE.

## Seeder

```bash
cd services/api
python scripts/seed_demo.py --user-id <supabase-user-id>
```

Creates Judge Demo Store, membership, demo event, wallet/store-credit/cashback seeds.
