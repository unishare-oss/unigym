# Unigym Repository Guide

## Scope

This file applies to the whole repository. Read the closer guide when working in
`apps/api` or `apps/web`. Keep instructions in exactly these three `AGENTS.md` files
unless the project grows enough to need another scope.

## Folder Structure

```text
unigym/
├── apps/
│   ├── api/             # NestJS API, Prisma schema and migrations
│   └── web/             # Next.js App Router application
├── scripts/             # Local and Oracle database helpers
├── plans/               # Project plans
├── .github/workflows/   # CI, image builds, release (see README.md)
├── compose.yaml         # Oracle-hosted development PostgreSQL
└── AGENTS.md            # Repository-wide instructions
```

This is a Bun workspace. Use the root `package.json` scripts and the committed Bun
lockfile. Keep API implementation in `apps/api` and browser UI in `apps/web`. Share
contracts only when both workspaces actually need them.

## Working Rules

- Do not create a git commit or push changes unless the user explicitly asks.
- Write commit messages as Conventional Commits (`feat(api): ...`, `fix(web): ...`,
  `chore: ...`); commitlint rejects others, and semantic-release versions from them.
- Branch from `dev` and open pull requests into `dev`. `main` is for releases.
- Preserve unrelated local changes. Do not add secrets or print `.env` values.
- Follow the nearest app guide and existing code patterns. Prefer direct, readable
  changes over speculative layers.
- The API owns Unigym data and authorization. uniAuth owns portable identity;
  Unigym keeps its own session and app-specific behavior.
- For local database work, follow `README.md`: Docker runs on Oracle and is reached
  through the local SSH tunnel. Do not start a second local database by default.

## Checks

Run the checks relevant to changed files. Root commands are `bun run lint`,
`bun run typecheck`, `bun run test`, and `bun run build`.

## Tracker: DoneWhen

DoneWhen is the issue tracker. Use its MCP tools (`mcp__donewhen__*`) and the `donewhen` skill. Load the skill before any ticket work.

Flow: Triage → Backlog → Aligning → Ready → In Progress → Blocked → In Review → Done → Canceled.

Rules:

- Ask me to confirm the title and scope before you create a ticket or an epic.
- Give every ticket a done-when checklist of 3 to 6 items. Set it with `set_criteria`. Derive the items from the spec. Do not make generic items.
- Tick each item with `check_criterion` the moment it is met. Do not wait for the end.
- The checklist gates In Review and Done. If an item is not done, do not move the ticket.
- If you cannot finish without me, move the ticket to Blocked. Write the reason in a comment.
- I review all code. Never move a ticket to Done. Stop at In Review.
- When you finish: `link_commit`, `set_issue_dev`, then `save_document` with what changed and how.

Where things live:

- Workspace: `my-workspace` (name `unigym`, key prefix `UG`)
- Epics: none yet. Propose one when a feature needs several tickets.
- Labels: one `type` label for each ticket (`bug`, `feature`, `chore`, `tech-debt`).
