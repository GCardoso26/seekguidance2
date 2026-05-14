# Autoscaling profiles

| Perfil | API min/max | Workers min/max | Notas |
|--------|-------------|-----------------|-------|
| staging | 1–3 | 1–4 | Custo baixo |
| production | 2–10 | 2–20 | HPA + CA |

GPU: pool separado com max=0 por defeito.
