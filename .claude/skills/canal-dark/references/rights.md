# Rights Gate

`POST /api/editorial/rights` + licenses no `AssetRegistry`.

Classificação:

| Classe | Auto-publish |
|---|---|
| ORIGINAL | permitido se o resto dos gates passar |
| PUBLIC_DOMAIN | permitido |
| LICENSED | só com créditos reais |
| USER_OWNED | permitido |
| UNKNOWN | **bloqueia** publicação automática |
| RESTRICTED | bloqueia |

`GENERATED` / `STOCK` / `UPLOADED` no CWM mapeiam para `ORIGINAL` no gate editorial (proveniência de fábrica, não stock pirateado).

`MOCK` / `mock_visual` → tratar como UNKNOWN para publish.

Nunca inventar créditos. Se não houver fonte, escrever UNKNOWN.

UNKNOWN ou RESTRICTED → pacote `READY_FOR_REVIEW`, nunca `READY_FOR_PUBLISH`.
