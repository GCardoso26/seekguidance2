# KYC.md

## Company KYC pipeline (no external integrations yet)

```
Company → Documents → Receita Federal (stub) → Bank Account (stub)
       → Representative → Status
```

Tables: `company_kyc_cases`, `company_kyc_documents`.  

Statuses: `draft | submitted | under_review | approved | rejected | restricted`.

Player CPF KYC remains in existing `app.kyc` (unchanged).
