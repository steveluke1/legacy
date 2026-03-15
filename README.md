# Cabal Legacy

Aplicacao local em `Next.js + TypeScript + pnpm + Tailwind CSS + shadcn/ui + Zod + ESLint + Vitest + Playwright`.

## Stack

- `Next.js` App Router
- `TypeScript`
- `pnpm`
- `Tailwind CSS`
- `shadcn/ui`
- `Zod`
- `ESLint`
- `Vitest`
- `Playwright`

## Execucao local

```bash
corepack pnpm install
corepack pnpm dev
```

## Comandos principais

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test:unit
corepack pnpm test:e2e
corepack pnpm build
corepack pnpm reset:data
corepack pnpm verify:final
```

## Estrutura ativa

- `app/`
- `components/`
- `lib/`
- `server/`
- `data/`
- `tests/`

## Observacoes

- O projeto roda `100%` localmente.
- Nao existe dependencia funcional de Base44, Supabase, Deno functions, React Router ou Vite runtime.
