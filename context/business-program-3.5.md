# Business Program 3.5 — UX & Admin Sandbox

**Status:** Implemented

## Header (Parte 1)

- Removed **Comprar** from header (Loja nav remains)
- Hidden **Trocar**
- Search centered (`flex-1` / `max-w-2xl`)
- User actions: Theme → Wishlist → Cart → Notifications → UserMenu (Vender)
- Mobile bottom: “Comprador” label for `/comprador`
- Checkout chrome unchanged

## APP_MODE + Admin Sandbox

```
production | beta | sandbox | development
```

Sandbox/development + allowlisted admin → SUPER_ADMIN entitlements, full plans, demo menu links.

## seed_demo()

`app/sandbox/seeder.py` + `scripts/seed_demo.py` — Identity → Financial → Tournament → analytics stub. Blocked in production.

## Docs

See `docs/sandbox/ADMIN_SANDBOX.md`.
