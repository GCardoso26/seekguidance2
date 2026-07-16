# Identity Domain (Sprint 4.1)

**Status:** Sprint 4.1 domínio ✅ · 4.2 PG ✅ · 4.3 JWT/API ✅  
**Equivale a:** `FOUNDATION_FREEZE.md` / `MARKETPLACE_DOMAIN.md`, agora para identidade.  
**Relaciona:** [`MARKETPLACE_DOMAIN.md`](./MARKETPLACE_DOMAIN.md) · [`SYSTEM_FLOW.md`](./SYSTEM_FLOW.md) · [ADR-007](./adr/ADR-007-marketplace-domain-boundaries.md)

## Princípio central

**Identidade ≠ papel.**  
`User` é quem a pessoa é. Ser vendedor é um **papel**, não identidade.

```text
User
  │  (SellerProfile — ponte)
  ▼
Seller Aggregate (Marketplace)
```

Um mesmo `User` pode, sem duplicar cadastro, ser:

- comprador (`buyer`)
- vendedor (`seller`) — via `SellerProfile`
- administrador (`admin`)

## Bounded context

```text
identity/
    domain/        User · Session · Role · Permission · SellerProfile + ports
    application/   RegisterUser · AssignRole · CreateSellerProfile · Authorization
    persistence/   InMemory (Sprint 4.1) → Postgres identity.* (Sprint 4.2)
    api/           (Sprint 4.3 — JWT/RBAC)
```

## Agregados & entidades

### User (aggregate root)
Identidade pura. Nunca contém anúncios, estoque nem perfil de loja.

| Campo | Notas |
|-------|-------|
| `id` | |
| `email` | normalizado (lowercase/trim), único |
| `displayName` | |
| `emailVerified` | boolean |
| `passwordHash` | opaco (`null` até definir) — nunca a senha em claro |
| `status` | `active` \| `disabled` |
| `rowVersion` | optimistic lock |

### SellerProfile (aggregate — a ponte)
Liga `User` (identidade) ao `Seller` (Marketplace). **Fora** do `User`.

| Campo | Notas |
|-------|-------|
| `id`, `userId`, `sellerId` | 1 user → 1 seller profile (por ora) |

Regra: criar um `SellerProfile` **concede o papel `seller`**. A criação do `Seller` em si é do Marketplace (Sprint 4.2/4.3).

### Session (aggregate)
Sessão de login (base para Refresh Token na Sprint 4.3).

| Campo | Notas |
|-------|-------|
| `id`, `userId`, `createdAt`, `expiresAt`, `revokedAt` | `active` = não revogada e não expirada |

### Role / Permission (policy)
Papéis fixos com conjuntos de permissões (RBAC congelado):

| Role | Permissions |
|------|-------------|
| `buyer` | *(navegar/comprar — perms de compra chegam na Sprint 5)* |
| `seller` | `seller:manage` · `inventory:write` · `listing:write` · `listing:delete` |
| `admin` | `admin:all` (implica todas) |

`Authorization.can(userId, permission)` deriva das roles atribuídas. `admin:all` concede tudo.

## Fronteiras (invioláveis)

1. `User` não guarda papel de negócio (seller/comprador) como campo — papéis são atribuições.
2. `SellerProfile` é a única ponte Identity → Marketplace; nunca copia dados do `Seller`.
3. Senha só como `passwordHash` (port `PasswordHasher`); nunca em claro, nunca logada.
4. JWT prova identidade + sessão; **roles sempre vêm do DB** (onboarding sem forçar re-login).

## Auth API (Sprint 4.3)

```text
POST /api/v1/auth/register
POST /api/v1/auth/login      → AccessToken + RefreshToken
POST /api/v1/auth/refresh
POST /api/v1/auth/logout     → revoga Session
```

Middleware: `RequireAuth` · `RequirePermission` · `CurrentUser`.  
Ports: `JwtSigner` / `JwtVerifier` (adapter HMAC-SHA256).

## Congelado para depois (contrato declarado, sem implementação)

Declarados como **tipo** (não implementados) para que o fluxo futuro fique limpo:

```text
register → EmailVerificationToken → confirm → emailVerified = true
request  → PasswordResetToken     → reset
```

- `EmailVerificationToken { token, userId, expiresAt, consumedAt }`
- `PasswordResetToken { token, userId, expiresAt, consumedAt }`

Sem tabelas nem repositórios ainda. Também fora: OAuth · SSO · MFA · CAPTCHA.

## Persistência (Sprint 4.2)

Schema `identity.*`: `users` · `roles` · `user_roles` · `sessions` · `seller_profiles`.  
Repository Contracts idênticos ao Catalog (insert/update/rollback/optimistic-lock/no-op/idempotency/concurrency), rodando contra InMemory **e** Postgres.  
Composition root: `createInMemoryIdentityStack()` / `createPostgresIdentityStack(pool)` / `createInMemoryAuthenticatedStack()`.
