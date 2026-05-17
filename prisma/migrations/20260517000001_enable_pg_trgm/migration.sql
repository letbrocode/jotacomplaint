-- Enable pg_trgm extension for trigram-based similarity search.
-- Required by duplicate.service.ts which uses similarity() in raw SQL
-- to detect near-duplicate complaint titles at submission time.
--
-- This is idempotent (IF NOT EXISTS) — safe to run multiple times.
-- On Neon it was previously enabled manually; this migration makes
-- it declarative for new databases, Docker, and CI environments.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
