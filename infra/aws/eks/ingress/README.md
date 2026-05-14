# Ingress (EKS)

## AWS Load Balancer Controller

- Instalar o controller IRSA-enabled.
- `IngressClass` `alb` com anotações `alb.ingress.kubernetes.io/scheme` internet-facing ou internal.
- Certificado **ACM** referenciado nas anotações TLS.

## Alternativa

NGINX Ingress + NLB — útil se quiseres evitar ALB; documenta custo vs simplicidade.
