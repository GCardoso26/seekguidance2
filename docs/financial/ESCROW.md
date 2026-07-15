# ESCROW.md

FSM: held → released | disputed | cancelled | manual_hold.

Table `fin_escrow_cases` + dual-read `escrow_transactions`. Checkout path unchanged.
