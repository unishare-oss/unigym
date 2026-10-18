# API App Guide

## Scope and Folder Structure

This is the Go API, built on Gin. Its `package.json` only maps the root Bun scripts to
the Go toolchain.

```text
apps/api/
├── cmd/api/              # main: serves, or `api migrate [up|down|status]`
├── internal/
│   ├── config/           # Environment settings
│   ├── db/               # pgx pool; sqlc output in db/sqlc (generated, never edit)
│   ├── server/           # Gin router, middleware, routes
│   ├── telemetry/        # OpenTelemetry tracing and the traced HTTP client
│   └── <feature>/        # Domain features, one package each
├── migrations/           # goose SQL migrations, embedded in the binary
├── queries/              # sqlc query files
├── sqlc.yaml
└── AGENTS.md
```

Put each domain feature in `internal/<feature>/`, with its handlers, service and tests.
Register its routes in `internal/server/server.go`. Put new routes under `/api/`.

There is no auth for now: every route is public. Do not add session or user handling
until auth is redone.

## Responsibilities

- Handlers bind request data and write responses.
- Services enforce business and authorization rules.
- Data access uses sqlc-generated queries over the pgx pool. Do not add empty
  pass-through layers.
- Use `telemetry.HTTPClient` for outgoing HTTP calls so they are traced.

## Data and Verification

- Add a new goose migration in `migrations/` for schema changes; never edit an applied
  one. Add queries in `queries/` and run `bun run db:generate` (sqlc).
- Keep tests next to the code (`*_test.go`). Tests that need PostgreSQL skip when
  `DATABASE_URL` is unset.
- Run `bun run --cwd apps/api lint`, `typecheck`, `test` and `build` as appropriate.
  Keep code `gofmt`-clean.
- Use `apps/api/.env.example` as the configuration reference. Never commit secrets.
