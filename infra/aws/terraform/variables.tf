variable "aws_region" {
  type        = string
  description = "Região AWS (ex.: eu-west-1)"
  default     = "eu-west-1"
}

variable "project_name" {
  type        = string
  description = "Prefixo de naming (ex.: tcg-judge)"
  default     = "tcg-judge"
}

variable "environment" {
  type        = string
  description = "staging | production"
  default     = "staging"
}
