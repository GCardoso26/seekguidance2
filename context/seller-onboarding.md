# Seller Onboarding Workflow

> Workflow ID: WF-001
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Marketplace Context
>
> Aggregate Root: Store
>
> Bounded Context: Marketplace
>
> Dependências:
>
> - business-rules.md
> - marketplace-architecture.md
> - permission-matrix.md
> - domain-event-contracts.md
> - cqrs-pattern.md
> - repository-pattern.md
> - unit-of-work.md

---

# Objetivo

O Seller Onboarding é o workflow responsável por transformar um usuário autenticado em um vendedor apto a operar dentro do JudgeTCG.

Este workflow cria toda a estrutura comercial necessária para que uma loja possa posteriormente:

- anunciar cartas;
- cadastrar produtos;
- vender;
- receber pagamentos;
- possuir equipe;
- responder tickets;
- construir reputação.

O onboarding nunca publica anúncios.

Ele apenas prepara a estrutura comercial da loja.

---

# Escopo

## Inclui

Criação da Store

Criação do primeiro usuário administrador

Configuração inicial

Criação das permissões padrão

Preferências iniciais

Criação das configurações financeiras

Configuração logística padrão

Aceite dos termos

Inicialização da auditoria

Emissão de eventos

---

## Não inclui

KYC

Validação bancária

Publicação de anúncios

Importação de catálogo

Cadastro de cartas

Cadastro de produtos

Recebimento financeiro

Reputação

---

# Atores

Seller

Marketplace

Sistema

Worker

Auditoria

---

# Pré-condições

Usuário autenticado.

Conta ativa.

Email confirmado.

Conta não bloqueada.

Aceite dos Termos de Uso.

Aceite da Política de Privacidade.

Nenhuma Store ativa vinculada ao mesmo CPF/CNPJ (conforme política vigente).

---

# Gatilho

O usuário seleciona:

"Tornar-se vendedor"

↓

Inicia CreateSellerOnboardingCommand

---

# Entradas

CreateSellerOnboardingCommand

Campos obrigatórios

Nome da Loja

Slug

CPF ou CNPJ

Telefone

Endereço principal

Cidade

Estado

CEP

País

Idioma

Moeda

Fuso horário

---

Campos opcionais

Logo

Banner

Descrição

Website

Instagram

Discord

WhatsApp comercial

---

# Aggregate Principal

Store

Todo o workflow possui consistência garantida pelo Aggregate Store.

---

# Aggregate Secundários

StoreUser

StoreSettings

StoreNotificationSettings

StoreShippingSettings

StoreFinancialSettings

StoreAudit

---

# Fluxo Principal

Usuário solicita abertura da loja.

↓

Validar autenticação.

↓

Validar dados obrigatórios.

↓

Validar unicidade do Slug.

↓

Validar CPF/CNPJ.

↓

Criar Aggregate Store.

↓

Criar Store Owner.

↓

Criar configurações padrão.

↓

Criar permissões iniciais.

↓

Criar preferências.

↓

Criar configurações financeiras.

↓

Criar configurações logísticas.

↓

Registrar Auditoria.

↓

Persistir Aggregate.

↓

Persistir Outbox.

↓

Commit.

↓

Emitir eventos.

↓

Retornar Store criada.

---

# Fluxos Alternativos

## Slug já utilizado

Retornar erro.

Nenhuma alteração persistida.

---

## Documento inválido

Retornar erro.

Workflow encerrado.

---

## Usuário bloqueado

Abortar.

Registrar tentativa.

---

## Erro de persistência

Rollback completo.

---

## Timeout

Rollback.

Reprocessamento permitido.

---

# State Machine

```text
Draft
   │
   ▼
Creating
   │
   ▼
Created
   │
   ▼
PendingVerification
   │
   ▼
Verified
   │
   ▼
Active
```

Estados alternativos

```text
Rejected

Suspended

Closed
```

---

# Regras de Negócio

## BR-001

Toda Store possui exatamente um Owner inicial.

---

## BR-002

O Owner recebe todas as permissões administrativas.

---

## BR-003

Slug é único.

---

## BR-004

Uma Store inicia em estado PendingVerification.

---

## BR-005

Nenhuma Listing pode ser publicada antes da ativação da Store.

---

## BR-006

Toda Store recebe configurações padrão.

---

## BR-007

Toda operação deve ser auditada.

---

## BR-008

A criação da Store deve ser idempotente.

---

## BR-009

O CPF/CNPJ informado deve obedecer às políticas de unicidade configuradas pela plataforma.

---

# Permissões

Seller.CreateStore

StoreOwner.*

Store.Manage

Store.Settings

Store.Team

Store.Inventory

Store.Listings

Store.Orders

Store.Finance

Store.Support

---

# Domain Policies

SellerEligibilityPolicy

StoreCreationPolicy

SlugPolicy

MarketplacePolicy

---

# Domain Services

StoreCreationService

SlugGenerationService

StoreInitializationService

DefaultPermissionService

AuditService

---

# Eventos Emitidos

StoreCreated

StoreOwnerAssigned

StoreSettingsInitialized

StoreNotificationSettingsCreated

StoreFinancialSettingsCreated

StoreShippingSettingsCreated

StoreAuditInitialized

SellerOnboardingCompleted

---

# Eventos Consumidos

UserRegistered

EmailVerified

---

# Compensações

Caso qualquer etapa falhe:

Rollback completo.

↓

Nenhuma Store criada.

↓

Nenhum evento publicado.

---

# Background Processing

Após Commit

Worker

↓

Criar Analytics iniciais.

↓

Criar Dashboard.

↓

Criar cache inicial.

↓

Criar índices de busca.

↓

Enviar Email de Boas-vindas.

↓

Enviar Notificação.

↓

Criar métricas iniciais.

---

# Integrações

Supabase

Redis

Stripe (futuro)

Cloudflare

Email Provider

Discord (opcional)

---

# SLA

SLA-001

Criação da Store

≤ 5 segundos

---

SLA-002

Inicialização completa

≤ 30 segundos

---

# Auditoria

Registrar

StoreId

OwnerId

CorrelationId

WorkflowId

TransactionId

IP

UserAgent

Timestamp

Operation

Payload resumido

---

# Observabilidade

Logs estruturados

Tracing distribuído

CorrelationId

WorkflowId

RequestId

Latency

Retry Count

---

# KPIs

KPI-001

Tempo médio de onboarding.

---

KPI-002

Taxa de sucesso.

---

KPI-003

Tempo até ativação.

---

KPI-004

Erros por etapa.

---

KPI-005

Tempo de criação.

---

KPI-006

Abandono do onboarding.

---

# Anti Patterns

É proibido

Criar Store parcialmente.

Persistir configurações fora da transação.

Publicar eventos antes do Commit.

Criar Owner sem Store.

Criar Store sem Auditoria.

Executar integrações externas durante a Transaction.

Criar permissões manualmente.

---

# Casos Extremos

Clique duplicado.

Retry do navegador.

Timeout.

Rollback parcial.

Slug reservado simultaneamente.

Usuário fecha navegador.

Perda de conexão.

Requisição repetida.

---

# Implementação Esperada

```text
Controller

↓

CreateSellerOnboardingCommand

↓

Validator

↓

Application Service

↓

StoreCreationService

↓

Store Aggregate

↓

Repository

↓

Unit Of Work

↓

Persist Audit

↓

Persist Outbox

↓

Commit

↓

Event Bus

↓

Workers

↓

Dashboard Projection

↓

Analytics Projection

↓

Notification Worker
```

---

# Dependências

permission-matrix.md

business-rules.md

marketplace-architecture.md

domain-event-contracts.md

repository-pattern.md

unit-of-work.md

cqrs-pattern.md

---

# Evolução

As próximas versões deste workflow poderão incluir:

- KYC automatizado.
- Verificação documental por OCR.
- Integração com Receita Federal.
- Verificação bancária automática.
- Cadastro de múltiplos estabelecimentos.
- Fluxo para Pessoa Física e Jurídica com regras distintas.
- Programa de onboarding guiado com checklist.
- Assistente de IA para configuração inicial da loja.
- Importação automática de inventário de outras plataformas.
- Score de risco durante o onboarding.

---

# Fluxo Resumido

```text
Usuário autenticado
        │
        ▼
Solicita abertura da loja
        │
        ▼
Validar elegibilidade
        │
        ▼
Criar Store
        │
        ▼
Criar Owner
        │
        ▼
Inicializar configurações
        │
        ▼
Registrar auditoria
        │
        ▼
Commit
        │
        ▼
StoreCreated
        │
        ▼
Workers
        │
        ├────────► Dashboard
        ├────────► Analytics
        ├────────► Cache
        ├────────► Notificações
        └────────► Email de boas-vindas
```

# Regra Fundamental

O Seller Onboarding é o único workflow autorizado a criar uma Store dentro do JudgeTCG.

Nenhum outro workflow pode instanciar uma Store, atribuir seu primeiro proprietário ou inicializar suas configurações fundamentais.

Toda loja nasce em estado **PendingVerification**, possui rastreabilidade completa desde sua criação e somente poderá participar do marketplace após cumprir os processos de verificação definidos pelos workflows subsequentes.