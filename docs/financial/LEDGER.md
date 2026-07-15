# LEDGER.md

Double-entry: `fin_accounts` + `fin_journals` + `fin_journal_entries`.

Rules: sum(debit)=sum(credit); append-only; never delete; idempotency_key unique on journals.

Service: `LedgerService.post_journal`. Dual-read Sprint 6 `ledger_entries` via adapter.
