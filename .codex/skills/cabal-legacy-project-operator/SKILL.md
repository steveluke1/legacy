---
name: cabal-legacy-project-operator
description: Use for work inside this specific repository when the task depends on the current Cabal Legacy architecture, local-only runtime rules, validation commands, or repo-specific guardrails.
---

# Cabal Legacy Project Operator

## Purpose

Use this skill only for this repository. It is the local operating manual for the final Cabal Legacy codebase after the migration.

Use it when the task depends on:

- the current Next.js App Router architecture
- local-only data and session behavior
- repo-specific validation commands
- file placement and boundary rules
- cleanup rules that keep the repo lean

Do not use this as a generic implementation skill.

## Activation Criteria

Use this skill when work happens inside the current Cabal Legacy workspace and any of the following are true:

- the task changes app structure, local data, auth, or tests
- the task needs repo-specific validation or cleanup commands
- the task risks reintroducing removed legacy patterns
- the task needs awareness of this repo's server/client boundaries

## Final Stack

This project must use only:

- Next.js
- TypeScript
- pnpm
- Tailwind CSS
- shadcn/ui
- Zod
- ESLint
- Vitest
- Playwright

## Current Source of Truth

Active app code lives only in:

- `app/`
- `components/`
- `data/`
- `lib/`
- `pages/_document.tsx`
- `scripts/`
- `server/`
- `tests/`

Do not recreate removed legacy areas or vendor-specific paths.

## File Placement Rules

- routes and pages go in `app/`
- route handlers go in `app/api/`
- reusable UI goes in `components/`
- schemas, types, and shared utilities go in `lib/`
- business logic goes in `server/services/`
- data access goes in `server/repositories/`
- local persisted data lives in `data/json/`
- canonical seeds live in `data/seeds/`
- tests live in `tests/`
- `pages/_document.tsx` is the only allowed Pages Router compatibility file

## Architecture Rules

- Server Components by default
- `use client` only for actual browser interaction
- UI must not import `server/*`
- UI must not read `data/*` directly
- route handlers validate input and delegate to services
- repositories are the only layer allowed to read and write local JSON data
- auth and session operations stay server-owned

## Data Rules

- the app runs 100% locally
- canonical runtime storage is JSON in `data/json/`
- canonical seed storage is JSON in `data/seeds/`
- seeds must stay deterministic and small
- tests must leave runtime data reset to seed baseline
- `sessions.json` and `password-resets.json` are runtime-ephemeral stores and still must reset cleanly

## Validation Commands

Use these commands for this repo:

- `corepack pnpm dev`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test:unit`
- `corepack pnpm test:e2e`
- `corepack pnpm build`
- `corepack pnpm verify:final`

Prefer `corepack pnpm` over `npm`.

## Cleanup Rules

Keep the repo lean:

- do not add unused helpers, wrappers, or compatibility shims
- do not reintroduce generated artifacts into versioned state
- keep config references aligned with real file names
- remove dead code when the replacement is already validated

## Forbidden Reintroductions

Do not reintroduce any functional dependency on:

- Base44
- Supabase
- Deno function runtime
- React Router
- Vite runtime
- remote-only data dependencies

## Repo-Specific Notes

- `eslint.config.mjs` is the active ESLint config
- `tailwind.config.mjs` is the active Tailwind config
- `components.json` must stay aligned with real aliases and config file names
- Playwright uses repo scripts to avoid fixed-port and generated-artifact drift
- `verify:final` is the canonical final gate

## Recommended Skill Pairing

Combine this skill with the smallest relevant implementation skill:

- `frontend-production-builder` for UI and App Router work
- `backend-api-builder` for route handlers and server logic
- `code-review-regression-auditor` for defect hunting
- `deploy-and-qa-gate` for final validation
- `asset-generator-for-web` for logos, icons, and visual assets

## Success Criteria

Work is aligned with this repository only if it:

- keeps the app inside the declared stack
- preserves local-only runtime behavior
- respects server/client boundaries
- keeps validation green
- does not add dead files or stale references