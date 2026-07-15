# COMPANY_DOMAIN.md

`Company` is the legal entity (CNPJ).

## Fields

CNPJ, razão social, nome fantasia, IE, endereço comercial, status, KYC status, trust score.

## Validation

`domain/cnpj.py` — digit normalize + checksum only. **No Receita Federal call** in Program 1.

## Service

- `CompanyService.create` — validates CNPJ  
- `CompanyService.ensure_from_store_owner` — lazy placeholder (`pending_cnpj`) linking existing stores via `stores.company_id`  
- `company_representatives` — legal reps  

Status machine: `pending_cnpj → active → suspended → closed`.
