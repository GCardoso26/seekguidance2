-- Bootstrap schema runtime (Postgres opcional)
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner TEXT,
    created_at DOUBLE PRECISION NOT NULL
);
