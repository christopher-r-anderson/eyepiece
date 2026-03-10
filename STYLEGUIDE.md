# Project Style Guide: File & Code Organization

This document outlines the architectural and naming conventions for this repository. Adhering to these ensures consistency across features and improves grep-ability.

## 1. File Naming Conventions

### Casing

Use lowercase with dashes (kebab-case).

- _Correct:_ `asset-tile.tsx`, `user-profile.ts`
- _Incorrect:_ `AssetTile.tsx`, `userProfile.ts`

### Domain Separation

Use periods to separate the filename from its functional suffix. Use the feature name as the main file name before the suffix if, and only if, there is not a more specific name already. This applies strictly to files with domain suffixes, not other files like components or hooks which are in their own directories, have their own conventions (`*.tsx`, `use-*.ts`), and / or otherwise are not likely to have numerous other files in the project with the same name - they do not need any prefix or suffix.

- _Format:_ `[feature-name].[suffix].ts`
- _Example:_ `favorites.queries.ts`, `auth.schema.ts`
- _Correct:_ `/src/features/assets/assets.queries.ts`, `/src/features/assets/asset-summaries.queries.ts`
- _Incorrect:_ `/src/features/assets/assets.asset-summaries.queries.ts`, `use-auth.hook.ts`, `assets.asset-tile.tsx`

### Domain Pluralization

Use plural suffixes for collections of exports and singular for architectural layers.

- _Plural:_ `.queries.ts`, `.commands.ts`, `.events.ts`, `.types.ts`, `.utils.ts`
- _Singular:_ `.repo.ts`, `.schema.ts` (the layer), `.provider.ts`

## 2. Directory Naming and Structure

### Features vs. Domain

- `/src/domain/`: Use **singular** names for core entities (e.g., `/domain/asset/asset.types.ts`).
- `/src/features/`: Use **plural** names for feature implementation (e.g., `/features/favorites/favorites.queries.ts`).

### Subdirectories

- _Flat over Nested:_ Do not create subdirectories for groupings / APIs if they only contain 1–2 files; except,
- _Required Folders:_ Always use folders for `components/`, `forms/`, and standalone `hooks/`.

## 3. Module Rules

- _No Barrel Files:_ Import directly from the source file.
- _Imports:_ Use path aliases (`@/features/...`) for cross-feature imports. Use relative paths (`./`) only when importing files within the same directory or feature.

## 4. Code Organization & Colocation

- _Types:_ Colocate derived types (e.g., `type User = z.infer<typeof userSchema>`) in the same file as the schema. Move shared or complex types to `.types.ts`.
- _Schemas/Hooks:_ Keep in-file if used locally. Move to separate files if they create circular dependencies or are used in >2 locations.
- _Repos/Commands and Hooks:_ Split logic into `makeXRepo` / `makeXCommands`. Add `useXRepo` / `useXCommands` when used by other hooks/components.
- _Queries:_ Query modules should expose options factories (`getXOptions`, `getInfiniteXOptions`) plus hook wrappers. Runtime helpers (`ensureX`, `fetchX`, `prefetchX`) should be added only when they are used by loaders.
- _Route Loaders:_ Prefer `await` in route loaders for query preloading so route-level pending/error handling works by default. Avoid returning loader data that duplicates query cache.
- _SUspense and Error Boundaries:_ Use route-level pending/error handling for page-critical data. If a page has multiple high-level sections, use a boundary at the section level to limit breakage to the failing section.

## 5. Environment & RPC Suffixes

When appropriate, always use TanStack Start import protection file naming conventions:

- **`.server.ts`**: Code that _must_ only execute on the server (`createServerOnlyFn`).
- **`.client.ts`**: Code that _must_ only execute in the browser (`createBrowserOnlyFn`).
- **`.functions.ts`**: Entry points for Server RPCs (`createServerFn`).
- **No suffix**: Isomorphic code that runs in both environments.
- Note that `create*OnlyFn` is used even with file suffix import protection since some isomorphic import patterns can cause confusing errors otherwise.
