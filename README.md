# lru-housing-associations

TypeScript scripts for exploring the UK Statistical Data Return (SDR) housing association dataset in `data/`.

## Requirements

- Node.js >= 24
- pnpm (managed via `devEngines` in `package.json`)

## Setup

```sh
pnpm install
```

## Running scripts

Run the default entry point:

```sh
pnpm start --name Rory
pnpm dev            # same, with watch mode
```

Run any other script file directly:

```sh
pnpm script src/scripts/my-script.ts
```

Node 24 strips TypeScript types natively, so plain `node src/index.ts` also works. `tsx` is used for watch mode and broader syntax support.

## Checks

```sh
pnpm typecheck      # tsc --noEmit (TypeScript 7 native compiler)
pnpm lint           # oxlint
pnpm lint:fix
pnpm test           # node:test runner
```

## Conventions

- ESM only (`"type": "module"`); relative imports include the `.ts` extension.
- Strict `tsconfig.json`, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- Runtime validation with Zod v4; schemas live under `src/schemas/<domain>/*.schema.ts` and are defined once and reused.
- Linting uses oxlint because `typescript-eslint` does not yet support TypeScript 7. Revisit once it does if type-aware rules are needed.
