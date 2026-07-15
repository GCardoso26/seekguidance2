# MEMBERSHIP_DOMAIN.md

```
User → Membership → Store
```

## Membership fields

`role`, `status`, `created_at`, `accepted_at`, `invited_by`  

**Never** use boolean flags (`is_seller`, `is_owner`).

## Status

`invited | active | suspended | revoked`

## RC1 bridge

If `memberships` empty → project `stores.owner_id` + `store_user_roles`.  
Optional dual-write to `store_user_roles` when `IDENTITY_DUAL_WRITE=true`.
