# API App Guide

## Scope and Folder Structure

This is the Bun-run NestJS API. Follow UniShare's responsibility-based backend
layout for new features:

```text
apps/api/
├── prisma/
│   ├── schema.prisma      # Canonical data model
│   └── migrations/        # Database history
├── src/
│   ├── auth/              # Better Auth config (uniAuth OIDC client, sessions)
│   ├── modules/           # Domain features, one folder each
│   ├── prisma/            # Prisma provider and database connection
│   ├── generated/prisma/  # Generated client; never edit manually
│   ├── app.module.ts      # Feature registration
│   └── main.ts            # Bootstrap
├── test/                  # End-to-end tests
└── AGENTS.md
```

Put each new domain feature in `src/modules/<feature>/`, with its module,
controller, service, and any DTOs, entities, repositories, or tests that the feature
actually needs. Register feature modules in `src/app.module.ts`. Keep cross-feature
HTTP helpers in `src/common/` if they become necessary. Keep auth configuration in
`src/auth/` and database infrastructure in `src/prisma/`.

`@thallesp/nestjs-better-auth` mounts Better Auth at `/api/auth/*`. Two global guards,
registered in order in `src/app.module.ts`, protect every route: the session guard
(`401`), then `ConsentGuard` (`403 consent_required` until the user accepts Unigym's
terms). Mark public routes with `@AllowAnonymous()`, routes a signed-in user needs
before consent with `@SkipConsent()`, and read the signed-in user with `@Session()`.
Put new routes under `/api/`.

## Responsibilities

- Controllers handle routes, request data, authentication context, and responses.
- Services enforce business and authorization rules.
- Repositories own Prisma queries when a feature needs a separate data-access layer.
- Use `Controller -> Service -> Repository -> Prisma` when all layers carry real
  responsibilities. Do not add empty pass-through classes.
- Keep Unigym-specific roles and permissions in this API, not in uniAuth.

## Data and Verification

- Change `prisma/schema.prisma` and add a migration for schema changes. Regenerate
  the Prisma client; never edit `src/generated/prisma` or an applied migration.
- Keep tests close to behavior under `src/`; use `test/` for HTTP end-to-end checks.
- Run focused checks with `bun run --cwd apps/api typecheck`, `lint`, `test`, and
  `test:e2e` as appropriate. Run `bun run --cwd apps/api build` for structural changes.
- Use `apps/api/.env.example` as the configuration reference. Never commit secrets.
