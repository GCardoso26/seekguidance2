# Raiz Terraform — sem recursos por defeito (evitar apply acidental).
# Descomenta o bloco provider após definir credenciais via OIDC/role na CI ou perfil local.

terraform {
  required_version = ">= 1.5.0"
}

# provider "aws" {
#   region = var.aws_region
# }
