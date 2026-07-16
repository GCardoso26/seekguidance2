# ADMIN_AUDIT.md

**Personas:** Administrador · SUPER_ADMIN · Usuário Sandbox  
**Surfaces:** Identity / Analytics / Financial / Tournament / Inventory / Health runtimes · Logs · Alerts · Migrations · Feature flags · Seeder · APP_MODE

## Journey verdict

Admin Sandbox (BP3.5) is a strong **DX accelerator** and a **production footgun** if misconfigured: empty allowlist elevates everyone; FE fails open; APP_MODE typo falls back to development elevation.

## Runtime checklist

| Runtime | Audit note | IDs |
|---------|------------|-----|
| Identity | Additive package; signup still Supabase | — |
| Analytics | BP2/3 emit not persisted | ANA-01 |
| Financial | Open mutators; dual wallet | SEC-001, FIN-01 |
| Tournament | Soft-open + IDOR writes | RBAC-001, SEC-002 |
| Inventory | Sync-cards under-authenticated | ADM-005 |
| Health | subject_id readable broadly | SEC-007 |
| Feature flags | All-on under elevate | ADM-003 |
| Seeder | Production blocked (good); status headers trust email | ADM-004 |
| APP_MODE | Unknown → development | ADM-002 |
| Sandbox allowlist | Empty = all elevated | ADM-001 |

## Recommendations

1. Require allowlist in sandbox.  
2. Fail-closed unknown APP_MODE.  
3. FE entitlements fail-closed.  
4. Seeder/status: JWT only.  
5. Admin “runtimes” dashboards must not imply Event Registry truth until ANA-01 fixed.
