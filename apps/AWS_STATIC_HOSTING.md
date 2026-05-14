# Front estático (S3 + CloudFront)

## Fluxo recomendado

1. **Build**: os HTML em `apps/` (ou subconjunto) são artefactos estáticos.
2. **S3 bucket** com website hosting desligado (preferir **CloudFront** + OAI/OAC).
3. **CloudFront** com HTTPS (ACM certificado US-EAST-1 se usar default domain).
4. **API**: ALB/Ingress EKS ou API Gateway com CORS restrito ao domínio CloudFront.

## Variáveis API relacionadas

- `API_GATEWAY_STAGE_URL` — readiness para BFF futuro.
- `CLOUDFRONT_DISTRIBUTION_ID` — invalidações de cache pós-deploy (CI).

## Integração replay visualizer

- Chamadas `fetch` à API devem usar HTTPS e o mesmo domínio apex ou subdomínio CORS permitido.

Mobile: layouts já `viewport` nos HTML modulares; validar Lighthouse após deploy.
