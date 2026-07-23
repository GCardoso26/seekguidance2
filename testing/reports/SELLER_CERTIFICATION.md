# SELLER_CERTIFICATION

**Date:** 2026-07-22  
**Persona:** Marina  
**Result:** **FAIL** for V4 catalog features

## Intended flows (not certified live)

Cadastro → Catálogo Mestre → Publish → Assets → Versioning → Knowledge → Relationships → Collections → Specs → Multi-store.

## Evidence blockers

1. `product_catalog.products = 0`  
2. `manufacturers/brands = 0`  
3. Publish para master listing exige variantes inexistentes  
4. Admin/asset endpoints sem auth (risco operacional)

## Existing seller E2E suite

Specs Playwright seller-* existem no repo; **não reexecutados** integralmente nesta campanha (foco certificação V4 data plane). Status: **NOT REVALIDATED**.

## Bugs

BUG-V4-001, 002, 003, 005, 009.
