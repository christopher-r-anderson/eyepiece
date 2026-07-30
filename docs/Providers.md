# Providers

Eyepiece treats each external content source as a provider. A provider is responsible for translating its upstream API into Eyepiece's domain model for search, asset detail, and any optional features such as albums or metadata.

This document covers the current provider model, where the main integration points live, and what must be updated when adding a new provider.

## Current Providers

- [NASA API portal](https://api.nasa.gov/) NASA Image and Video Library
- [The Smithsonian Institution Open Access API](https://edan.si.edu/openaccess/apidocs/)

| Provider                                               | ID         | Upstream integration        | Supported operations                         | Search filters | Runtime config  |
| ------------------------------------------------------ | ---------- | --------------------------- | -------------------------------------------- | -------------- | --------------- |
| NASA Image and Video Library                           | `nasa_ivl` | `src/integrations/nasa-ivl` | Search, asset detail, album detail, metadata | Year range     | None            |
| Smithsonian Open Access, National Air and Space Museum | `si_oa`    | `src/integrations/si-oa`    | Search, asset detail                         | None today     | `SI_OA_API_KEY` |

### Runtime Configuration

`SI_OA_API_KEY` is read when `src/server/eyepiece/service.ts` builds the provider map, which happens at module load. A deployment without it fails to start rather than failing on its first Smithsonian request, which is deliberate: this is required configuration, and a provider adapter built on demand would hide a misconfigured environment until a visitor hit that provider. A new provider with its own credential should follow the same shape.

The e2e suite replays recorded provider responses and makes no upstream request, so it runs without the key. See `docs/EnvironmentVariables.md`.

## Architecture

### Core Model

Provider identity is centralized in `src/domain/provider/provider.schema.ts`.

- `ProviderId` is a closed set of supported provider IDs.
- `providerIdSchema` validates route params, database values, and UI state.
- Provider-aware domain objects use `{ providerId, externalId }` keys so the same external ID can exist in more than one provider safely.

This provider key shape is used across assets, albums, routes, favorites, and collections.

### Provider Contract

The server-side contract lives in `src/server/eyepiece/provider.ts`.

Every provider implements a `BaseProvider` with these required operations:

- `getProviderId`
- `capabilities`
- `getSearchFiltersSchema`
- `searchAssets`
- `getAsset`

Providers can also opt into additional capabilities:

- `AlbumsCapability` for `getAlbum`
- `MetadataCapability` for `getMetadata`

Capability support is explicit on the provider contract via `capabilities`, and is checked at runtime with `hasAlbums` and `hasMetadata`. This keeps the common contract small while making optional behavior intentional instead of inferred from method presence.

Optional capability semantics are distinct from missing resources:

- unsupported optional operations return `UNSUPPORTED_PROVIDER_OPERATION`
- supported lookups return `null` only when the upstream provider reports a missing resource
- operational upstream failures are wrapped as `PROVIDER_REQUEST_FAILED`

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

- `src/routes/(public)/api/v1/search.ts`
- `src/routes/(public)/api/v1/asset/$providerId.$assetId.ts`
- `src/routes/(public)/api/v1/asset/$providerId.$assetId.metadata.ts`
- `src/routes/(public)/api/v1/albums/$providerId.$albumId.ts`

These serve the app's own client and nothing else. Their shape tracks the domain schema and is not frozen before 1.0: a deploy that changes it can leave an already-open tab rendering badly until reload, the same accepted window as a single-release schema change. A compatibility stance for the version segment comes with 1.0, or earlier if an external consumer appears.

## Collection Responses

Collection responses share the same `PaginatedCollection<TItem, TCollection>` contract from `src/domain/pagination/pagination.schema.ts`.

- `TItem` is the item type in `items`.
- `TCollection` is optional collection-level metadata exposed as `collection`.

Every paginated response keeps the same core shape:

- `items`
- `pagination` with `next` and `total`

When a response needs collection-level metadata, it can provide the second generic without changing pagination semantics or introducing a separate wrapper type.

Albums currently use `PaginatedCollection<Asset, AlbumCollectionMetadata>`, where `collection.title` is used for display title/heading text.

For NASA IVL specifically, the `/album/{id}` response does not expose a collection-level title. The adapter provides a display-friendly fallback derived from the album identifier.

## Asset Text

An asset carries three strings with three different jobs. Keeping them distinct is an accessibility requirement, not a style preference: if the same text lands in the image's alt, the heading and the description, a screen reader announces it two or three times.

- **title** names the record. It is the page heading and the accessible name of a tile's link.
- **alt** is a text alternative for the image, and is present only when the provider supplied a real one. Absent means no alternative exists, which is not the same as an empty one.
- **description** is supplementary prose under the image. Absent means the record has nothing worth showing.

Where each comes from:

|             | Smithsonian                                                                 | NASA                                |
| ----------- | --------------------------------------------------------------------------- | ----------------------------------- |
| title       | the record's title                                                          | `title`                             |
| alt         | the media item's accessibility alt text, on about two thirds of records     | nothing suitable exists             |
| description | the Summary notes, else the media item's extended accessibility description | `description`, with markup stripped |

The rules that go with it:

- A description that equals the title once normalized is dropped. Roughly one in seven NASA image records repeats its title verbatim.
- An empty string counts as absent. Smithsonian populates the alt field with an empty value on real records.
- The title-duplicate rule does not apply to alt. The image falls back to the title when no alternative exists, so discarding an alt that resembles the title would lose the record of whether a real one exists without changing anything rendered.
- That fallback happens where the image renders, not in the mapper, so the API keeps the distinction.
- The image always has an alt attribute. An empty one would drop it out of the accessibility tree, which costs more than repetition on a page whose subject is the image. Grid tiles are the opposite case: their alt is empty because the surrounding link already carries the title.

Two fields look like they belong here and do not. NASA's `description_508` reads like a text alternative but is a shortened copy of the description. Smithsonian's physical description is materials and dimensions, which belongs with the rest of the metadata.

One caution for a future provider or a wider Smithsonian filter: alt quality is a property of the contributing unit, not of the field. The National Air and Space Museum, which the Smithsonian search is pinned to, writes real visual descriptions. Another unit fills the same field with a machine-generated credit line, which would be worse than the title fallback. A non-empty value is not evidence of a usable one.

The sampling behind these numbers, and the screen reader testing behind the markup decisions, are recorded in #184.

## Asset Images

An asset carries at most one image: the master's width and height plus a rendition ladder, widest first and never empty. Surfaces lay out on the master's aspect ratio and build a `srcset` from the ladder. A record with no browser-decodable file carries no image at all; a placeholder would hand the layout a dimension it then believes.

Where the ladder comes from:

- NASA publishes fixed derivative files per record: the sized alternates, then the original when it is decodable and at most 3MB, then the preview, which is present on every record and keeps the ladder from coming back empty.
- Smithsonian's delivery service is a IIIF Image API 2.0 server, so the ladder is cut from the master at fixed widths up to 2560, never asking for an upscale. Records that declare no size anywhere (about one in nine) cost one `info.json` request for the master's dimensions.

The byte cap on NASA originals bounds weight only, and NASA offers no cut between the 1920 alternate and the original. On records whose original is under the cap but far wider than any surface renders (about 15% of the originals that make it), a 2x detail view pays the full file for detail it can only partly show. Accepted in favor of sharpness; a width guard would trim those bytes by capping those records at 1920. The sampled numbers are in #194.

## Source Link

An asset carries a link to its own record at the provider, rendered as attribution under the detail image. Both current providers supply one for every record, but the field is optional: a provider that cannot address its records is a real possibility.

Smithsonian records carry `record_link` directly, an ARK that resolves to the museum's collection page. The NASA API returns no such field, so the link is built from the id the site addresses records by, `https://images.nasa.gov/details/<nasa_id>`, escaped because ids contain spaces.

Dates, creators and per-record rights were considered for the same line and left out. Coverage is lopsided: NASA has a date on every record and Smithsonian on about half, while creator and rights run the other way. Rights are stated site-wide in the footer instead.

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

`src/routes/(public)/api/v1/search.ts` accepts query text, pagination, and provider-specific filter params. The route normalizes those values into the shared `SearchFilters` shape before calling the provider service.

This keeps the public API consistent while still allowing each provider to define its own filter surface.

### Search UI

Provider selection is exposed as the scope tabs on the search results page (`src/features/search/components/search-scope-tabs.tsx`): all libraries, or one provider. The tabs derive from `PROVIDERS` and `PROVIDER_DISPLAY`, so a new provider appears automatically.

The search UI splits across two components joined by one form:

- The header search bar (`src/features/search/components/search-bar.tsx`) renders the query input and carries the active scope as hidden fields.
- The conditions line (`src/features/search/components/search-conditions.tsx`) renders result counts and any provider-specific filter controls. The controls join the search form through the `form` attribute (`SEARCH_FORM_ID`). At the moment, NASA is the only provider with such controls: the year range inputs.

If a new provider needs custom search controls, the current pattern is to:

- define a provider-specific filter schema in `src/domain/search/providers/`
- render its filter UI conditionally from the conditions line, associated with the search form via the `form` attribute

## Persistence

Providers also affect persisted data because saved records must retain their source.

### Provider IDs in the Database

Supabase stores provider identity with the `provider_id` enum. The generated types live in `src/integrations/supabase/database.types.ts`.

This matters anywhere Eyepiece stores references to upstream assets, especially when a feature needs stable cross-request identifiers.

### Asset Preview Snapshots

`asset_preview_snapshots` stores a normalized preview record keyed by provider ID and external ID.

This table is used when the application needs a durable local reference to an externally hosted asset preview, such as favorites and collection items.

Related code lives in:

- `src/features/assets/asset-preview-snapshots.repo.ts`
- `supabase/migrations/20260321151530_rename_asset_preview_snapshots.sql`

#### Changing the shape

A snapshot is written only when someone stars an asset or adds it to a collection, and refreshed on that path once it is past the stale window. Nothing refreshes it on a read, and `favorites` and `collection_items` both reference it `ON DELETE RESTRICT`.

The stored image is nullable. A provider record can carry no file we can render, and a placeholder would hand the layout a dimension it then believes; the width, height and ladder are written together or not at all. Surfaces render the tile's own background in that case.

A stored snapshot is therefore the only copy of that preview the site holds. Changing the table's shape requires:

- deriving the new columns from the old ones in the migration, since rows can be neither dropped nor left to repair themselves
- a backfill that re-ensures every stored key through its provider, for whatever the old columns could not supply
- expand and contract across two releases once the site takes traffic, so no running code meets a column it does not know

The rendition ladder change (#194) is the worked example, and took the single release deliberately: a handful of rows, and no public site to break.

### Favorites and Collections

Favorites and collection items are provider-aware indirectly through the preview snapshot they point to. The repository layers validate provider IDs when reading those records back into domain types.

Related code lives in `src/features/favorites/favorites.repo.ts` and `src/features/collections/collections.repo.ts`.

## Adding a New Provider

Adding a provider is mostly a matter of updating the provider-specific seams that already exist.

### Required Changes

1. Add the new provider ID to `src/domain/provider/provider.schema.ts`.
2. Add a provider-specific search filters schema under `src/domain/search/providers/`.
3. Extend `searchFiltersSchema` in `src/domain/search/search.schema.ts`.
4. Update `src/routes/(public)/api/v1/search.ts` so query params can be parsed for the new provider.
5. Implement a new adapter under `src/server/eyepiece/providers/<provider>/` that satisfies `BaseProvider` and any optional capabilities it supports.
6. Add or reuse an upstream integration client under `src/integrations/<provider>/`.
7. Decide where its title, alt and description come from, following Asset Text above, and where a link to the record itself comes from, following Source Link. A provider with no real alt data is expected; a provider whose alt field is populated with something other than a description is the case to watch for.
8. Register the adapter in `src/server/eyepiece/service.ts`.
9. Extend the `AllLibrariesCount` sum in `src/features/search/components/search-conditions.tsx` - it invokes one search-total hook per shipped provider, so a provider missing there is silently omitted from the all-libraries count even though its scope tab appears. Add provider-specific filter UI in the same file if needed (the scope tabs themselves pick the provider up from `PROVIDERS`).
10. Update any provider-facing labels in the UI.
11. If the provider can be persisted in preview snapshots (favorites, collection items), update the Supabase enum and related migrations/types.

### Capability Decisions

When adding a provider, decide only what the upstream source can support today:

- If it can return individual assets, implement `getAsset`.
- If it can search, implement `searchAssets`.
- If it exposes album or collection membership that Eyepiece should surface, implement `getAlbum`.
- If it exposes structured detail data worth returning as raw metadata, implement `getMetadata`.

Set `capabilities` to match those optional operations explicitly. Do not emulate unsupported operations by returning empty values such as `{}` or `null` from a provider that does not actually support them.

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
- `src/routes/(public)/api/v1/search.ts`
- `src/server/eyepiece/provider.ts`
- `src/server/eyepiece/service.ts`
- `src/server/eyepiece/providers/`
- `src/features/search/components/search-bar.tsx`
- `src/features/search/components/search-conditions.tsx`
- `src/features/favorites/favorites.repo.ts`
- `src/features/assets/asset-preview-snapshots.repo.ts`
