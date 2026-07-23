-- Ensure pg_trgm is available for optional fuzzy search (API prefers ILIKE).
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
