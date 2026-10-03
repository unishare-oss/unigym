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

| Path                               | Purpose                                           |
| ---------------------------------- | ------------------------------------------------- |
| `apps/web`                         | Next.js App Router, Tailwind CSS, shadcn/ui       |
| `apps/api`                         | NestJS, Better Auth, Prisma schema and migrations |
| `compose.yaml`                     | Oracle-hosted PostgreSQL, loopback only           |
| `scripts/remote-db-up.sh`          | Copy Compose file and start Oracle database       |
| `.github/workflows/`               | CI, image builds, release (see below)             |
| `Dockerfile.api`, `Dockerfile.web` | Production images for the API and web app         |

Add gym domain models to `apps/api/prisma/schema.prisma` as requirements become concrete, then create a migration with `bun run db:migrate`.

## Checks

```sh
bun run lint
bun run typecheck
bun run test
bun run --cwd apps/api test:e2e
bun run build
```

The Git pre-commit hook formats staged files and runs lint and typecheck; the commit-msg hook checks [Conventional Commits](https://www.conventionalcommits.org) with commitlint. `bun install` installs both hooks in a Git checkout.

## Branches, CI and releases

Work goes into `dev` through pull requests; `dev` is merged into `main` to release. The pipeline follows Unishare's:

| Workflow                    | When                        | What                                                                                                                                                                                                        |
| --------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                    | push and PR to `main`/`dev` | Install, migrations, lint, typecheck, unit and e2e tests, build                                                                                                                                             |
| `docker.yml`                | push to `main`/`dev`        | Builds only the changed images on native `linux/arm64` runners and pushes them to GHCR: `latest` + `sha-<commit>` from `main`, `dev` + `sha-<commit>-dev` from `dev`. Then writes the tag to `k8s-practice` |
| `release.yml`               | after images on `main`      | semantic-release: version, `CHANGELOG.md`, GitHub release, and `v<version>` image tags                                                                                                                      |
| `dependabot-auto-merge.yml` | Dependabot PRs to `main`    | Approves and auto-merges weekly dependency updates                                                                                                                                                          |
| `codeql.yml`                | by hand                     | CodeQL analysis                                                                                                                                                                                             |

Repository settings the pipeline reads:

- Secrets `APP_ID`, `APP_PRIVATE_KEY`: the release bot. Without them the release is skipped.
- Secrets `GITOPS_APP_ID`, `GITOPS_APP_PRIVATE_KEY`, and variables `GITOPS_VALUES_FILE` (main) / `GITOPS_VALUES_FILE_DEV` (dev): the values file in `k8s-practice` to write image tags into. Without the variable the deploy step is skipped.
- Variables `API_URL` / `DEV_API_URL` and `UNIAUTH_URL` / `DEV_UNIAUTH_URL`: baked into the web image. Without them the Dockerfile defaults are used.
