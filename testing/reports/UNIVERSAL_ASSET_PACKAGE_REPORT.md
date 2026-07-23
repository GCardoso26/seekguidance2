# UNIVERSAL_ASSET_PACKAGE_REPORT

**Date:** 2026-07-22

## Extension of V3 PublisherAssetPackage

Added slots: images, pdf, rules, decklist, marketingKit, releaseNotes, pressKit, videos, icons, logos, banners, social (+ editorial already present).

## Catalog registry

`product_catalog.product_asset_packages` points to Asset Pipeline / CDN URLs — **no new Asset BC**.

## Kinds

`images | pdf | rules | decklist | marketing_kit | release_notes | press_kit | videos | icons | logos | banners | social | editorial`

## Marketplace

Knowledge panel surfaces `downloads` + `marketing_files` from package kinds.
