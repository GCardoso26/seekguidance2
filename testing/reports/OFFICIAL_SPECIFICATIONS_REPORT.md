# OFFICIAL_SPECIFICATIONS_REPORT

**Date:** 2026-07-22

## Table

`product_catalog.product_specifications` — structured columns per `spec_schema` (`sleeve`, `deckbox`, `playmat`, `booster`, `binder`, `generic`). Free-form bags are not SoT (`extra` only for residual official fields).

## Service

`OfficialSpecificationsService.upsert` / `listByProductId`

## Field coverage

| Schema | Key fields |
|--------|------------|
| Sleeve | width/height/thickness, material, PVC/acid free, finish, pieces, microns |
| Deckbox | capacity, material, weight, closure, color, water resistant |
| Playmat | dimensions, material, rubber thickness, surface, stitched border |
| Booster | cards, foils, language, region, MSRP, weight |

## Policy

No AI. Official manufacturer/publisher specs only.
