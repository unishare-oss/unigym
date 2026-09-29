# Unigym

Unigym is a Bun monorepo with a Next.js web app, NestJS API, Prisma, and PostgreSQL. It uses [uniAuth](https://github.com/unishare-oss/uniAuth/blob/main/docs/integrating-an-app.md) as its OpenID Connect provider. Better Auth keeps a separate Unigym session on the web host. The API maps people by uniAuth `sub`, through the local `Account` row.

## Local development

Requirements: Bun 1.4.2, a configured `ssh oracle` host for the development PostgreSQL database, and a local uniAuth client. The [uniAuth app integration guide](https://github.com/unishare-oss/uniAuth/blob/main/docs/integrating-an-app.md#local-development) explains how to run uniAuth and create that client. Register `http://127.0.0.1:3003` as its web origin. This checkout's API runs on port 3001.

```sh
bun install
cp apps/api/.env.example apps/api/.env
bun run db:up
bun run db:tunnel
```

Set `UNIAUTH_CLIENT_ID`, `UNIAUTH_CLIENT_SECRET`, and `BETTER_AUTH_SECRET` in `apps/api/.env`. The sample issuer is `http://localhost:3002/api/auth`; use the URL of your local uniAuth server. Keep the tunnel running in its own terminal. In another terminal:

```sh
bun run db:generate
bun run --cwd apps/api db:deploy
bun run dev
```

Open `http://127.0.0.1:3003/login`. The web app proxies `/api/*` to the API at `http://localhost:3001`, so the Better Auth callback and cookie stay on the web host. The API health route is `http://localhost:3001/api/health`. Stop the tunnel with Ctrl+C. `bun run db:down` stops only the development database on Oracle.

The Unigym Terms and Privacy text was approved for production on 29 September 2026. New users must accept it before protected use. `UNIGYM_LEGAL_APPROVED=true` enables the consent endpoint.

## Production

The Kubernetes chart and rollout checklist are in `unishare-oss/k8s-practice/unigym-chart`. It uses a separate PostgreSQL PVC and daily local plus Cloudflare R2 backups. Cluster maintainers must seal runtime and R2 credentials, then verify a restore before the first sync. The existing production uniAuth client ID and sealed client secret are used; there is no new production client to create.

The API serves signed uniAuth event receivers at `/api/uniauth/backchannel-logout`, `/api/uniauth/user-deleted`, and `/api/uniauth/user-updated`. They verify the issuer, audience, signature, subject, and exact event. Account deletion removes the local user and its sessions; future gym tables must add deletion cleanup.

## Checks

```sh
bun run lint
bun run typecheck
bun run test
bun run --cwd apps/api test:e2e
bun run build
```

The pre-commit hook formats staged files and runs lint and typecheck. The CI workflow also builds both `linux/arm64` Docker images. Add gym domain models to `apps/api/prisma/schema.prisma` as requirements become concrete, then create a migration with `bun run db:migrate`.
