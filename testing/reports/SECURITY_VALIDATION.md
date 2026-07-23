# SECURITY_VALIDATION

**Date:** 2026-07-23  
**Result:** **PASS** (achados V4 remediados + re-certificados)

## Findings

| ID | Issue | Sev | Status |
|----|-------|-----|--------|
| BUG-V4-003 | Admin product-catalog endpoints sem auth | P1 | CLOSED |
| BUG-V4-004 | GET knowledge-coverage muta DB | P1 | CLOSED |
| BUG-V4-010 | RLS off em tabelas product_catalog | P3 | CLOSED |

## Recert evidence

- Admin routes: `Depends(require_admin)` + BFF 401 sem sessão  
- GET coverage: `computeReport()` read-only; POST `/refresh` + scheduler  
- RLS: 28/28 on; 0 client policies; schema USAGE false for anon/authenticated  
- Server reads: products=260 / providers=89 OK  

## Checks not executed

- AuthZ matrix lojista/comprador/admin live  
- Upload path abuse  
- Connect/PIX/Checkout auth regression live  
- Pen-test uploads/downloads

## Verdict

Security gate V4 (003/004/010) **PASS**.
