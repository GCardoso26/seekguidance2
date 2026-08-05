# KNOWLEDGE_GRAPH_REPORT — AUDIT_PASS_2026-07-29

## Status

**NÃO CERTIFICADO nesta pass.**

Nenhuma query de integridade (órfãos, master_variant, packages/contents, duplicatas de SKU) foi executada contra produção nesta sessão.

## Sinais laterais

- product-catalog search retorna items (existência parcial de dados).
- Logs: falhas `uq_asset_version` → risco de inconsistência de assets ligados a produtos.
- Relatórios históricos `QA_PLATFORM_V6_KNOWLEDGE_GRAPH` **não** revalidados.

## Critério READY

Knowledge Graph íntegro = **FALSE** (falta de prova).
