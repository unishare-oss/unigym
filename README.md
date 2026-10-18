# Unigym

Bun monorepo with a Next.js web app (Tailwind CSS, shadcn/ui) and a Go API (Gin, pgx, goose, sqlc) on PostgreSQL. Sign-in is removed for now; it will come back through [uniAuth](https://github.com/unishare-oss/uniAuth/blob/main/docs/integrating-an-app.md).

## Start locally

Requirements: Bun 1.4.2, Go 1.26, and the configured `ssh oracle` host. Docker runs on Oracle; the web and API apps run locally.

```sh
bun install
cp apps/api/.env.example apps/api/.env
bun run db:up
bun run db:tunnel
```

Keep the tunnel running in its own terminal. In another terminal:

```sh
bun run db:migrate
bun run dev
```

Open <http://localhost:3000>. The API health endpoint is <http://localhost:3001/health>. `bun run db:up` copies `compose.yaml` to `/home/ubuntu/unigym` and runs PostgreSQL on Oracle, bound to the VM's loopback port `5433`. `bun run db:tunnel` forwards that port to local `5433`; local Docker is not used. Stop the tunnel with Ctrl+C and stop the remote database with `bun run db:down`.

## Structure

| Path                               | Purpose                                     |
| ---------------------------------- | ------------------------------------------- |
| `apps/web`                         | Next.js App Router, Tailwind CSS, shadcn/ui |
| `apps/api`                         | Go API: Gin, goose migrations, sqlc queries |
| `compose.yaml`                     | Oracle-hosted PostgreSQL, loopback only     |
| `scripts/remote-db-up.sh`          | Copy Compose file and start Oracle database |
| `.github/workflows/`               | CI, image builds, release (see below)       |
| `Dockerfile.api`, `Dockerfile.web` | Production images for the API and web app   |

Add gym tables as goose migrations in `apps/api/migrations/` and their queries in `apps/api/queries/`, then run `bun run db:migrate` and `bun run db:generate` (sqlc). Production images embed the migrations: run `/api migrate up` before starting a new version.

## Checks

```sh
bun run lint
bun run typecheck
bun run test
bun run build
```

`bun run test` runs the migration test against `DATABASE_URL` when it is set. The Git pre-commit hook formats staged files and runs lint and typecheck; the commit-msg hook checks [Conventional Commits](https://www.conventionalcommits.org) with commitlint. `bun install` installs both hooks in a Git checkout.

## Branches, CI and releases

Work goes into `dev` through pull requests; `dev` is merged into `main` to release. The pipeline follows Unishare's:

| Workflow                    | When                        | What                                                                                                                                                                                                        |
| --------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                    | push and PR to `main`/`dev` | Install, migrations, lint, typecheck, tests, build                                                                                                                                                          |
| `docker.yml`                | push to `main`/`dev`        | Builds only the changed images on native `linux/arm64` runners and pushes them to GHCR: `latest` + `sha-<commit>` from `main`, `dev` + `sha-<commit>-dev` from `dev`. Then writes the tag to `k8s-practice` |
| `release.yml`               | after images on `main`      | semantic-release: version, `CHANGELOG.md`, GitHub release, and `v<version>` image tags                                                                                                                      |
| `dependabot-auto-merge.yml` | Dependabot PRs to `main`    | Approves and auto-merges weekly dependency updates                                                                                                                                                          |
| `codeql.yml`                | by hand                     | CodeQL analysis                                                                                                                                                                                             |

Repository settings the pipeline reads:

- Secrets `APP_ID`, `APP_PRIVATE_KEY`: the release bot. Without them the release is skipped.
- Secrets `GITOPS_APP_ID`, `GITOPS_APP_PRIVATE_KEY`, and variables `GITOPS_VALUES_FILE` (main) / `GITOPS_VALUES_FILE_DEV` (dev): the values file in `k8s-practice` to write image tags into. Without the variable the deploy step is skipped.
- Variables `API_URL` / `DEV_API_URL`: baked into the web image. Without them the Dockerfile defaults are used.
