# UNIVERSAL_METADATA_SCHEMA_REPORT

**Date:** 2026-07-22

## Single schema

`product_catalog.product_official_metadata` + TS `UniversalProductMetadata`.

Fields: publisher, manufacturer, game, expansion, collection, series, releaseDate, language, country, msrp, sku, upc, ean, isbn, weight, dimensions, contents, materials, finish, rarity, productLine, productFamily, edition, legalStatus, lifecycle, assetTrust, assetScore.

## Completeness

`metadataCompleteness()` drives `products.knowledge_completeness`.

## Providers

All publishers/manufacturers should map into this schema via sync jobs (scheduler tick lists metadata sync). Provider-specific bags are not authoritative.
