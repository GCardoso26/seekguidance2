# STORE_DOMAIN.md

`Store` is separated from `Company`. One Company may own **1..N** Stores.

## Store capabilities (product)

Brand, catalog, team, events, inventory, finance, reputation, pickup policy, marketplace settings.

## Schema

- Existing `tcg_judge.stores` retained (`owner_id` unchanged).  
- Additive nullable `company_id`.  

## Inventory types (policy layer)

`PRODUCT | EVENT | SERVICE | DIGITAL | GIFT_CARD` — shared inventory abstraction at **policy** level (does not rewrite inventory tables in Program 1).

## Service

`StoreOrgService.get_org_view` / `link_company`.
