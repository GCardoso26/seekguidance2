# PERMISSION_ENGINE.md

## Rule

Every screen/API check must use:

```python
await PermissionService(session).can(user_id, "store.inventory.view", store_id=...)
```

Forbidden:

- `if user.is_seller`
- `if role == "owner"`

## Registry

Stable strings in `identity_platform/permissions/registry.py`  
Catalog endpoint: `GET /runtime/judge/identity/permissions/catalog`  
Check endpoint: `GET /runtime/judge/identity/permissions/check`

## Dual-read

If platform role matrix does not match, falls back to legacy `seller_rbac.has_store_permission` via module.action mapping.
