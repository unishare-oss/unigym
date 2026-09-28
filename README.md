# Unigym

Bun monorepo with a Next.js web app, NestJS API, Tailwind CSS, shadcn/ui, Prisma, and PostgreSQL. Authentication will be provided by a separate service in a future repository. Unigym currently has no login flow or protected member endpoint.

The `Member` table has a provider-neutral `externalSubject` field so it can be linked to that service later. Its contract and token validation will be added when the service exists. The migration from the earlier Auth0 scaffold renames the column and preserves existing member rows.

## Start locally

Requirements: Bun 1.4.2 and the configured `ssh oracle` host. Docker runs on Oracle; the web and API apps run locally.

```sh
bun install
cp apps/api/.env.example apps/api/.env
bun run db:up
bun run db:tunnel
```

Keep the tunnel running in its own terminal. In another terminal:

```sh
bun run db:generate
bun run db:migrate
bun run dev
```

Open <http://localhost:3000>. The API health endpoint is <http://localhost:3001/health>. `bun run db:up` copies `compose.yaml` to `/home/ubuntu/unigym` and runs PostgreSQL on Oracle, bound to the VM's loopback port `5433`. `bun run db:tunnel` forwards that port to local `5433`; local Docker is not used. Stop the tunnel with Ctrl+C and stop the remote database with `bun run db:down`.

## Structure

| Path                       | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| `apps/web`                 | Next.js App Router, Tailwind CSS, shadcn/ui           |
| `apps/api`                 | NestJS, Prisma member model and migrations            |
| `compose.yaml`             | Oracle-hosted PostgreSQL, loopback only               |
| `scripts/remote-db-up.sh`  | Copy Compose file and start Oracle database           |
| `.github/workflows/ci.yml` | Install, migration, lint, typecheck, tests, and build |

Add gym domain models to `apps/api/prisma/schema.prisma` as requirements become concrete, then create a migration with `bun run db:migrate`.

## Checks

```sh
bun run lint
bun run typecheck
bun run test
bun run --cwd apps/api test:e2e
bun run build
```

The Git pre-commit hook formats staged files and runs lint and typecheck. `bun install` installs it in a Git checkout.
