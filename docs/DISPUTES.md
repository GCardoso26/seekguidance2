# Disputas — estrutura futura

O módulo de disputas com juízes certificados será implementado em fase posterior. Esta documentação descreve o schema planejado.

## Tabelas (não criadas ainda)

### `shop_disputes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| order_id | UUID | Pedido relacionado |
| initiator_id | TEXT | Quem abriu (comprador ou lojista) |
| type | TEXT | `item_not_received`, `wrong_item`, `damaged`, etc. |
| status | TEXT | `open`, `under_review`, `resolved`, `closed` |
| judge_id | TEXT | Juiz atribuído (nullable) |
| resolution | TEXT | Decisão final |
| created_at | TIMESTAMPTZ | |
| resolved_at | TIMESTAMPTZ | |

### `shop_dispute_messages`

Mensagens trocadas entre partes e juiz.

### `shop_dispute_evidence`

URLs de fotos/documentos anexados.

## UI atual

A aba **Disputas** no dashboard do lojista exibe empty state até o módulo ser implementado.

## SLA alvo

- Resposta inicial: 4h
- Resolução com juiz: até 48h
- Meta de resolução favorável: 95%
