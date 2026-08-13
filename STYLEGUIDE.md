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
- _Imports:_ Use relative paths within the same feature or directory tree; use path aliases (`@/...`) when crossing a layer or feature boundary. The layering lint rules catch alias spellings and relative crossings at the depths in the tree today; a cross-feature relative import (`../auth/...`) is shape-ambiguous and always evades them (see Import Layering).

## 4. Code Organization & Colocation

- _Types:_ Colocate derived types (e.g., `type User = z.infer<typeof userSchema>`) in the same file as the schema. Move shared or complex types to `.types.ts`.
- _Schemas/Hooks:_ Keep in-file if used locally. Move to separate files if they create circular dependencies or are used in >2 locations.
- _Repos/Commands and Hooks:_ Split logic into `makeXRepo` / `makeXCommands`. Add `useXRepo` / `useXCommands` when used by other hooks/components.
- _Queries:_ Query modules should expose options factories (`getXOptions`, `getInfiniteXOptions`) plus hook wrappers. Runtime helpers (`ensureX`, `fetchX`, `prefetchX`) should be added only when they are used by loaders.
- _Route Loaders:_ Prefer `await` in route loaders for query preloading so route-level pending/error handling works by default. Avoid returning loader data that duplicates query cache.
- _SUspense and Error Boundaries:_ Use route-level pending/error handling for page-critical data. If a page has multiple high-level sections, use a boundary at the section level to limit breakage to the failing section.
- _One-shot Status Params:_ Success redirects from form actions carry a one-shot `status` param: seed page state from it, then strip it (and any accompanying `formError`) with a replace navigation (`useOneShotFormStatus`).
- _Feature Component Props:_ Feature components expose curated props: forward `...props` into the underlying ui component or `Pick<>` exactly what is forwarded. Derive variant prop types from the ui type; never hand-copy unions.

## 5. Import Layering

Dependency direction: `routes` -> `app` -> `features` -> `components` -> `domain` / `lib`, with `integrations` at the bottom alongside `domain` and `lib`.

- `/src/app/` is the composition layer: the shell, layout, providers, and route boundaries/guards. It may import features and components; nothing below `routes` imports it.
- Features never import other features. Exceptions, allowlisted in `eslint.config.ts` until they graduate to a shared home: auth's non-UI primitives (`get-user`, auth queries, auth search params) and the asset preview snapshot modules in `features/assets`.
- `/src/components/` is the shared, feature-free UI layer. `components/ui` is the domain-agnostic kit; other `components/` dirs may use domain types but never feature behavior (no queries, commands, or server functions).
- Router primitives (`Link`, `useNavigate`, `useLocation`, `useRouterState`) are ambient app infrastructure, usable in features and shared components. Route-specific APIs (`Route.useSearch`, `getRouteApi`, loader data) stay in route files and their `-components/`.
- `-components/` directories are colocation, not a layer: components scoped to a route segment live next to it, deep in the tree.

ESLint enforces the boundaries (`no-restricted-imports` blocks in `eslint.config.ts`). The rules match import specifiers, not resolved paths: alias spellings are always caught, and relative crossings are caught at the depths listed in the config. A cross-feature relative import (`../auth/...` from another feature) is shape-identical to a same-feature one and can never be flagged - watch for it in review.

## 6. Environment & RPC Suffixes

When appropriate, always use TanStack Start import protection file naming conventions:

- **`.server.ts`**: Code that _must_ only execute on the server (`createServerOnlyFn`).
- **`.client.ts`**: Code that _must_ only execute in the browser (`createBrowserOnlyFn`).
- **`.functions.ts`**: Entry points for Server RPCs (`createServerFn`).
- **No suffix**: Isomorphic code that runs in both environments.
- **`.form-actions.ts`**: Server functions targeted by native (no-JS) form posts via `action={fn.url}`. They answer full-document POSTs only and must always end in a redirect; hydrated submits are intercepted before reaching them.
- Note that `create*OnlyFn` is used even with file suffix import protection since some isomorphic import patterns can cause confusing errors otherwise.

## 7. Styling

Mechanics and reasoning: [docs/Styling.md](./docs/Styling.md). The rules:

- Tokens and semantic tokens live in `panda/`; no raw `var(--x)` theme values in styles.
- Variants live in config recipes in component-adjacent `*.recipe.ts` files; variant values selected at runtime (drilled or computed props) carry scoped `staticCss`.
- App code styles inline with `css()` and patterns; hoist only for reuse or genuinely unwieldy blocks.
- A stored style object is wrapped in `css.raw(...)`; an inline object in a `css` prop is not. Config-evaluated style modules use `as const satisfies` instead.
- Overrideable ui primitives take `css` + `className` (`StyleProps`); wrappers merge defaults with `css.raw(defaults, css)`, never a spread. Fixed-surface components (ModalDialog, Sheet) deliberately expose neither.
- Base styles use shorthands for commonly overridden properties; overrides use the base's exact keys.
- ui components never carry sibling-spacing margins (Separator, whose role is spacing, is the exception); parents own spacing via `gap`. Self-centering like Form's `margin: '0 auto'` is placement, not spacing.
- Globals keep element appearance only, never sibling-spacing rules; heading space binds to the content that follows.
- Recurring patterns become variants; genuine one-offs stay `css` overrides.
- `[bracketed]` values are the deliberate strictTokens exceptions; keep them rare.
- Markup hooks added solely for audit tooling use a `data-audit-` prefix; `data-testid` exists only in unit-test mocks.
