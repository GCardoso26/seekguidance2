# Visio — consultas do onboarding

Gerado por `python3 scripts/generate_onboarding_visio.py` (stencil `stencils/Judge_doc.vsdx` extraído em `/tmp/visio_vsdx`).

| Arquivo | Uso |
|---------|-----|
| `JudgeTCG_Onboarding_Consultas.vsdx` | Abrir no **Microsoft Visio** (uma aba por fluxo de consulta) |
| `JudgeTCG_Onboarding_Consultas.xlsx` | **Transpor** no Visio: Visualizador de Dados, ou copiar linhas da aba `Catalogo_Consultas` |
| `JudgeTCG_Onboarding_Consultas.drawio` | diagrams.net |
| `JudgeTCG_Onboarding_Consultas.html` | Prévia sem Visio |

Fonte de conteúdo: [`docs/engineering/TEAM_ONBOARDING_ESTADO_ATUAL.md`](../../engineering/TEAM_ONBOARDING_ESTADO_ATUAL.md).

## Transpor no MS Visio (Excel)

1. Abra o `.xlsx`.
2. Aba `Como_importar_Visio` — passos.
3. Abas `Q01_Health` … `Q10_Auth` usam as colunas do Visualizador de Dados:
   - Process Step ID
   - Process Step Description
   - Next Step ID (vários separados por `;`)
   - Connector Label
   - Shape Type (`Start/End`, `Process`, `Decision`, `Data`, `External Data`, `Subprocess`)
   - Function / Area
4. Aba `Catalogo_Consultas` lista **todas** as consultas HTTP/SQL/externas com o estado de produção de 2026-09-09.

## Regenerar

```bash
unzip -qo docs/architecture/visio/stencils/Judge_doc.vsdx -d /tmp/visio_vsdx
python3 scripts/generate_onboarding_visio.py
```
