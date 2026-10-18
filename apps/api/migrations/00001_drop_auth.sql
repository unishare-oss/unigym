-- Auth is removed for now. Drops the Better Auth tables and Prisma's history table
-- left by the NestJS API. Safe on a fresh database.

-- +goose Up
DROP TABLE IF EXISTS verification, account, session, "user", _prisma_migrations CASCADE;

-- +goose Down
-- Not reversible: auth comes back as its own migration.
SELECT 1;
