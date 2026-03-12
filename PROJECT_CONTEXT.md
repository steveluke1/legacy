# Project Context

## Current Repository State

- Current frontend stack: Vite + React 18 + React Router.
- Current backend shape: Deno-style serverless functions in `functions/`.
- Current remote dependencies in use across the repo: Base44 and Supabase.
- The repository contains legacy duplication, empty files, wrappers, aliases, and mixed auth flows.
- Playwright was activated in the current repo and a minimal smoke test was added and verified locally.

## User-Mandated Target State

The final project must use only this stack:

- Frontend/App: Next.js
- Language: TypeScript
- Package manager: pnpm
- Styling: Tailwind CSS
- UI components: shadcn/ui
- Validation: Zod
- Lint: ESLint
- Tests: Playwright + Vitest

Hard constraints:

- Remove all Base44 usage.
- Remove all Supabase usage.
- Remove all Deno/function-runtime usage tied to the old platform.
- Final system must run 100% locally.
- Final repository must be as lean as possible.
- Do not keep old files, dead folders, duplicate providers, unused wrappers, or obsolete dependencies in the final state.

## New Skills Created For This Work

These skills were added to the global Codex skills directory to support this migration:

- `platform-migration-orchestrator`
- `local-persistence-replacement`

Design intent:

- They must not override existing skills unless the task is truly platform migration or local persistence replacement.
- They include explicit delegation rules to avoid interfering with frontend, backend, review, or QA skills.

## Decisions Already Made

### 1. Migration Strategy

This project should be handled as controlled replatforming by replacement, not as an in-place adaptation of the Vite/Base44/Supabase codebase.

Meaning:

- Build the new platform cleanly.
- Migrate only what is useful.
- Remove the entire legacy platform only after the new platform passes the cutover gates.

### 2. Local Persistence Strategy

Default local persistence starts with deterministic local files and repository modules.

Rule:

- Start with local JSON-backed persistence plus TypeScript repositories.
- Promote specific domains to SQLite only if JSON becomes unsafe or too fragile for those domains.

### 3. Auth Strategy

The final app must have a single local auth design:

- user auth
- admin auth
- HTTP-only cookie sessions
- server-owned guards
- Zod-validated inputs and outputs

No Base44 auth and no Supabase auth remain in the final system.

### 4. Legacy Removal Policy

Legacy code is not removed first.

Legacy removal happens only after:

- the Next.js target boots locally
- critical routes render
- local auth works
- critical flows work
- required tests pass
- no critical flow still depends on the old platform

## Final Migration Plan

### Phase 1. Scope Freeze

Classify everything in the current repo into:

- migrate complete
- migrate simplified
- local stub
- remove

Domains to classify:

- public pages
- user auth
- admin auth
- user account area
- rankings
- guilds and character pages
- store
- marketplace and ALZ flows
- notifications
- admin surfaces
- seed/demo flows

### Phase 2. Clean Target Architecture

Build the new structure around:

- `app/`
- `app/api/`
- `components/`
- `lib/`
- `server/`
- `data/`
- `tests/`

### Phase 3. Contracts First

Create TypeScript types and Zod schemas before broad migration:

- user
- admin
- session
- character
- guild
- ranking
- product
- listing
- order
- notification
- admin dashboard data
- simulated payment/webhook payloads

### Phase 4. Backend Reimplementation

Replace `functions/` with:

- `app/api/*/route.ts`
- `server/services/*`
- `server/repositories/*`
- `server/adapters/*`

All old integrations that must remain behaviorally available become deterministic local adapters.

### Phase 5. Frontend Migration By Flow

Migrate in this order:

1. app shell, layout, providers, navigation, theme, toasts
2. public pages
3. login, register, recovery
4. user area
5. rankings, guilds, character
6. store
7. marketplace and ALZ
8. admin

### Phase 6. Local Seeds

Create deterministic local seed data early for:

- users
- admins
- rankings
- characters
- guilds
- products
- listings
- orders
- notifications
- admin reports and dashboard data

### Phase 7. Verification Gates

- Gate 1: Next.js app boots with pnpm, lint passes, typecheck passes
- Gate 2: user auth and admin auth work locally
- Gate 3: local persistence reads and writes reliably
- Gate 4: public pages and user area work
- Gate 5: rankings, guilds, character, store, notifications work
- Gate 6: marketplace/ALZ and admin work deterministically
- Gate 7: Vitest and Playwright critical suites pass
- Gate 8: final build passes with no legacy dependencies

### Phase 8. Aggressive Final Cleanup

Only after Gate 8:

- delete `functions/`
- delete `src/`
- delete old Vite-only structure
- delete Base44 references
- delete Supabase references
- delete Deno-specific code
- delete React Router usage
- delete duplicate auth providers
- delete temporary wrappers and aliases
- delete empty files and obsolete report components
- clean `package.json`
- switch fully to `pnpm-lock.yaml`

### Phase 9. Lean Repo Audit

Before calling the migration done, confirm:

- no dead files remain
- no dead folders remain
- no old imports remain
- no remote dependency remains
- no obsolete test scaffolding remains
- no compatibility layer remains without purpose

## Playwright Status

Playwright was enabled in the current legacy repo during this conversation.

What was done:

- Playwright dependency added
- local Chromium installed
- base config added
- minimal smoke test added
- a small export mismatch was fixed to let the smoke test pass

This activation was done as a practical safety step before the larger migration.

## Definition Of Done

The migration is only complete when:

- the repository uses only the target stack
- the repository runs locally with no Base44 or Supabase
- there is no legacy Vite/Deno/React Router structure left
- the remaining files are all useful to the final app
- the app is functionally usable in local-only mode
- lint, typecheck, Vitest, Playwright, and build pass for the final stack

## Working Principle

Do not preserve code just because it exists.

Preserve only code and files that materially contribute to the final local Next.js application.
