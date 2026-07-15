# USER_DOMAIN.md

Every registration is a **natural person** (`User`). There is no `user_type`.

## Required attributes (product contract)

| Field | RC1 source / extension |
|---|---|
| Nome | `player_profiles.display_name` |
| CPF | KYC `cpf_hash` / verified_at |
| Email / Celular | `identity_users` extension |
| Endereço | `identity_users.address` |
| Consentimentos LGPD | `lgpd_consents` |
| MFA / Passkey | `identity_users.mfa_status` / `passkey_status` (`disabled\|pending\|ready`) |

## Service

`UserService.get_me(user_id)` → projection + `default_role=BUYER`.

Store access always comes from **Membership**, never from a boolean on User.
