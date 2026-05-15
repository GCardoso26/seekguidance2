# Plataforma runtime híbrida AWS + mobile

## Âmbito

- `app/runtime/aws_runtime/`: config, saúde, scaling, failover, observabilidade, storage/queues, sync de replay, custos e recuperação — **tudo stub e opcional**, sem `boto3` obrigatório.
- Integração real fica atrás de feature flags e credenciais; o núcleo judge/replay permanece local-first.

## Princípios

- Explainability-first, replay determinístico, soft normalization, reasoning_v1…v11 intocados.
