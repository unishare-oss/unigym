# Unigym

Bun monorepo with a Next.js web app, NestJS API, Tailwind CSS, shadcn/ui, Prisma, and PostgreSQL. People sign in through [uniAuth](https://github.com/unishare-oss/uniAuth/blob/main/docs/integrating-an-app.md) (OpenID Connect). The API uses Better Auth as the OIDC client and keeps Unigym's own session. Every API route needs a session unless it is marked `@AllowAnonymous()`.

## Start locally

Requirements: Bun 1.4.2 and the configured `ssh oracle` host. Docker runs on Oracle; the web and API apps run locally.

```sh
bun install
cp apps/api/.env.example apps/api/.env
bun run db:up
bun run db:tunnel
```

Sign-in needs a local uniAuth and a client for `http://127.0.0.1:3003`. Follow [uniAuth local development](https://github.com/unishare-oss/uniAuth/blob/main/docs/integrating-an-app.md#local-development), then set `UNIAUTH_CLIENT_ID`, `UNIAUTH_CLIENT_SECRET` and `BETTER_AUTH_SECRET` in `apps/api/.env`. The API refuses to start without them. The e2e tests do not need uniAuth: they start a mock provider.

Keep the tunnel running in its own terminal. In another terminal:

```sh
bun run db:generate
bun run db:migrate
bun run dev
```

Open <http://localhost:3000>. The API health endpoint is <http://localhost:3001/health>. `bun run db:up` copies `compose.yaml` to `/home/ubuntu/unigym` and runs PostgreSQL on Oracle, bound to the VM's loopback port `5433`. `bun run db:tunnel` forwards that port to local `5433`; local Docker is not used. Stop the tunnel with Ctrl+C and stop the remote database with `bun run db:down`.

## Structure

| Path                               | Purpose                                               |
| ---------------------------------- | ----------------------------------------------------- |
| `apps/web`                         | Next.js App Router, Tailwind CSS, shadcn/ui           |
| `apps/api`                         | NestJS, Better Auth, Prisma schema and migrations     |
| `compose.yaml`                     | Oracle-hosted PostgreSQL, loopback only               |
| `scripts/remote-db-up.sh`          | Copy Compose file and start Oracle database           |
| `.github/workflows/ci.yml`         | Install, migration, lint, typecheck, tests, and build |
| `.github/workflows/images.yml`     | Build and push `linux/arm64` images to GHCR           |
| `Dockerfile.api`, `Dockerfile.web` | Production images for the API and web app             |

Add gym domain models to `apps/api/prisma/schema.prisma` as requirements become concrete, then create a migration with `bun run db:migrate`.

## Checks

```sh
bun run lint
bun run typecheck
bun run test
bun run --cwd apps/api test:e2e
bun run build
```

The Git pre-commit hook formats staged files and runs lint and typecheck. CI also builds both `linux/arm64` Docker images. `bun install` installs it in a Git checkout.
