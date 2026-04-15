# Providers

Eyepiece treats each external content source as a provider. A provider is responsible for translating its upstream API into Eyepiece's domain model for search, asset detail, and any optional features such as albums or metadata.

This document covers the current provider model, where the main integration points live, and what must be updated when adding a new provider.

## Current Providers

- [NASA API portal](https://api.nasa.gov/) NASA Image and Video Library
- [The Smithsonian Institution Open Access API](https://edan.si.edu/openaccess/apidocs/)

| Provider                                               | ID         | Upstream integration        | Supported operations                         | Search filters         | Runtime config  |
| ------------------------------------------------------ | ---------- | --------------------------- | -------------------------------------------- | ---------------------- | --------------- |
| NASA Image and Video Library                           | `nasa_ivl` | `src/integrations/nasa-ivl` | Search, asset detail, album detail, metadata | Media type, year range | None            |
| Smithsonian Open Access, National Air and Space Museum | `si_oa`    | `src/integrations/si-oa`    | Search, asset detail                         | None today             | `SI_OA_API_KEY` |

## Architecture

### Core Model

Provider identity is centralized in `src/domain/provider/provider.schema.ts`.

- `ProviderId` is a closed set of supported provider IDs.
- `providerIdSchema` validates route params, database values, and UI state.
- Provider-aware domain objects use `{ providerId, externalId }` keys so the same external ID can exist in more than one provider safely.

This provider key shape is used across assets, albums, routes, and favorites.

### Provider Contract

The server-side contract lives in `src/server/eyepiece/provider.ts`.

Every provider implements a `BaseProvider` with these required operations:

- `getProviderId`
- `getSearchFiltersSchema`
- `searchAssets`
- `getAsset`

Providers can also opt into additional capabilities:

- `AlbumsCapability` for `getAlbum`
- `MetadataCapability` for `getMetadata`

Capability support is checked at runtime with `hasAlbums` and `hasMetadata`. This keeps the common contract small while allowing providers to expose richer behavior when the upstream source supports it.

### Provider Service

`src/server/eyepiece/service.ts` is the composition layer for providers.

- It builds a provider map keyed by `ProviderId`.
- It resolves the correct adapter for incoming requests.
- It exposes a single internal service API for search, asset lookup, album lookup, and metadata lookup.

Routes and client code do not call provider adapters directly. They go through this service so that provider selection stays centralized.

### Adapters and Upstream Integrations

Each provider adapter lives under `src/server/eyepiece/providers/<provider>/` and converts upstream responses into Eyepiece domain objects.

- NASA adapter: `src/server/eyepiece/providers/nasa-ivl/nasa-ivl.provider.ts`
- Smithsonian adapter: `src/server/eyepiece/providers/si-oa/si-oa.provider.ts`

Adapters depend on the lower-level API clients in `src/integrations/<provider>/`. The integration layer handles external request and response mechanics. The adapter layer handles Eyepiece-specific mapping and pagination behavior.

### Request Flow

The provider flow is consistent across search and detail pages:

1. UI or client code selects a `providerId`.
2. Route handlers validate `providerId` and other inputs with Zod.
3. The route calls `makeEyepieceProviderService()`.
4. The service dispatches to the selected provider adapter.
5. The adapter calls the upstream integration and maps the result into Eyepiece types.
6. The response is returned through the route as provider-neutral JSON.

The main provider-aware API routes are:

- `src/routes/api/search.ts`
- `src/routes/api/asset/$providerId.$assetId.ts`
- `src/routes/api/asset/$providerId.$assetId.metadata.ts`
- `src/routes/api/albums/$providerId.$albumId.ts`

## Search

### Search Schema

Search input is modeled as a discriminated union in `src/domain/search/search.schema.ts`.

- The discriminator is `providerId`.
- Each provider supplies its own `filters` schema.
- The result is a strongly typed search payload that aligns with the selected provider.

Current filter schemas live in:

- `src/domain/search/providers/nasa-ivl-filters.ts`
- `src/domain/search/providers/si-oa-filters.ts`

### Search API

`src/routes/api/search.ts` accepts query text, pagination, and provider-specific filter params. The route normalizes those values into the shared `SearchFilters` shape before calling the provider service.

This keeps the public API consistent while still allowing each provider to define its own filter surface.

### Search UI

Provider selection is exposed in `src/features/search/components/search-bar.tsx`.

- The landing page lets the user choose a provider before starting a search.
- The search results page lets the user switch providers and refine filters.
- Provider-specific UI is rendered conditionally based on `providerId`.

At the moment, NASA is the only provider with advanced filter controls. Those controls live in `src/features/search/components/providers/nasa-ivl-filters.tsx`.

If a new provider needs custom search controls, the current pattern is to:

- define a provider-specific filter schema in `src/domain/search/providers/`
- add its filter UI under `src/features/search/components/providers/`
- render that UI conditionally from the shared search bar

## Persistence

Providers also affect persisted data because saved records must retain their source.

### Provider IDs in the Database

Supabase stores provider identity with the `provider_id` enum. The generated types live in `src/integrations/supabase/database.types.ts`.

This matters anywhere Eyepiece stores references to upstream assets, especially when a feature needs stable cross-request identifiers.

### Asset Preview Snapshots

`asset_preview_snapshots` stores a normalized preview record keyed by provider ID and external ID.

This table is used when the application needs a durable local reference to an externally hosted asset preview, such as favorites.

Related code lives in:

- `src/features/assets/asset-preview-snapshots.repo.ts`
- `supabase/migrations/20260321151530_rename_asset_preview_snapshots.sql`

### Favorites

Favorites are provider-aware indirectly through the preview snapshot they point to. The repository layer validates provider IDs when reading those records back into domain types.

Related code lives in `src/features/favorites/favorites.repo.ts`.

## Adding a New Provider

Adding a provider is mostly a matter of updating the provider-specific seams that already exist.

### Required Changes

1. Add the new provider ID to `src/domain/provider/provider.schema.ts`.
2. Add a provider-specific search filters schema under `src/domain/search/providers/`.
3. Extend `searchFiltersSchema` in `src/domain/search/search.schema.ts`.
4. Update `src/routes/api/search.ts` so query params can be parsed for the new provider.
5. Implement a new adapter under `src/server/eyepiece/providers/<provider>/` that satisfies `BaseProvider` and any optional capabilities it supports.
6. Add or reuse an upstream integration client under `src/integrations/<provider>/`.
7. Register the adapter in `src/server/eyepiece/service.ts`.
8. Add provider selection and, if needed, provider-specific filter UI in `src/features/search/components/search-bar.tsx`.
9. Update any provider-facing labels in the UI.
10. If the provider can be persisted in favorites or preview snapshots, update the Supabase enum and related migrations/types.

### Capability Decisions

When adding a provider, decide only what the upstream source can support today:

- If it can return individual assets, implement `getAsset`.
- If it can search, implement `searchAssets`.
- If it exposes album or collection membership that Eyepiece should surface, implement `getAlbum`.
- If it exposes structured detail data worth returning as raw metadata, implement `getMetadata`.

A provider does not need to support every capability to be useful.

### Database Touchpoints

If the new provider will appear in persisted records, update all of the following together:

- Supabase enum definition for `provider_id`
- generated database types
- any SQL functions that accept `provider_id`
- any code that validates provider IDs when reading database rows

### Testing Expectations

Provider work should usually include:

- unit tests for new schemas
- unit tests for adapter mapping and capability behavior
- route tests for provider-aware API handlers when behavior changes
- integration tests only where they add confidence beyond mapper-level coverage

## Practical Reference

For most provider changes, these are the files to inspect first:

- `src/domain/provider/provider.schema.ts`
- `src/domain/search/search.schema.ts`
- `src/routes/api/search.ts`
- `src/server/eyepiece/provider.ts`
- `src/server/eyepiece/service.ts`
- `src/server/eyepiece/providers/`
- `src/features/search/components/search-bar.tsx`
- `src/features/favorites/favorites.repo.ts`
- `src/features/assets/asset-preview-snapshots.repo.ts`
