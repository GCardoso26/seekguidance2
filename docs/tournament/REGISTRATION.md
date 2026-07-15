# REGISTRATION.md

Status machine:

`pending_payment → paid → registered → confirmed → checked_in → playing → completed`

Also: `no_show`, `cancelled`, `refunded`.

Service: `RegistrationService` with transition validation. Table: `event_registrations`.
