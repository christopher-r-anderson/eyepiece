# NASA IVL Fixtures

## `search.q.apollo.json`

- Source URL: `https://images-api.nasa.gov/search?q=apollo`
- Captured: 2026-04-15
- Purpose: Real multi-result NASA search payload for client parsing and provider search mapping tests.

## `search.nasa-id.PIA24439.json`

- Source URL: `https://images-api.nasa.gov/search?nasa_id=PIA24439`
- Captured: 2026-04-15
- Purpose: Single-result NASA search payload for provider `getAsset` tests and client parsing of `nasa_id` queries.
- Notes: This is the fixture to use when the code calls the search endpoint as an asset lookup.

## `album.Apollo-at-50.json`

- Source URL: `https://images-api.nasa.gov/album/Apollo-at-50?page=1`
- Captured: 2026-04-15
- Purpose: Real NASA album payload for provider pagination and album mapping tests.
- Notes: The album identifier is case-sensitive in the source system, so the fixture filename preserves `Apollo-at-50`.

## `album.invalid-album.error.json`

- Source URL: `https://images-api.nasa.gov/album/invalid-album?page=1`
- Captured: 2026-04-15
- Purpose: NASA album error payload for client error handling and provider error propagation tests.
- Notes: This file is an error body, not a collection response.

## `metadata.PIA24439.json`

- Source URL: `https://images-assets.nasa.gov/image/PIA24439/metadata.json`
- Captured: 2026-04-15
- Purpose: Real NASA metadata payload for passthrough metadata tests.
- Notes: This fixture matches the `search.nasa-id.PIA24439.json` asset lookup fixture.

## `search.nasa-id.S68-27041.json`

- Source URL: `https://images-api.nasa.gov/search?nasa_id=S68-27041`
- Captured: 2026-07-28
- Purpose: Record whose `description` is identical to its `title`, which is how roughly 14% of NASA image records arrive. Covers dropping a description that only repeats the title.

## `search.nasa-id.PIA01249.json`

- Source URL: `https://images-api.nasa.gov/search?nasa_id=PIA01249`
- Captured: 2026-07-30
- Purpose: Record with no `alternate` links, which is how about 8% of NASA image records arrive. Its original is small enough to serve, so it covers the ladder falling through to `canonical` and `preview`.
