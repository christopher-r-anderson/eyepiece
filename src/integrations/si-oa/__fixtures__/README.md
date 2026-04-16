# Smithsonian Open Access Fixtures

These files are imported directly into tests, so fixture payloads should stay as standard `.json` with no comments.

Record fixture provenance here instead of inside the JSON files.

## Current Fixtures

### `search.q.apollo.json`

- Source URL: `https://api.si.edu/openaccess/api/v1.0/search?q=apollo+AND+online_media_type%3AImages+AND+data_source%3A%22National+Air+and+Space+Museum%22&start=0&rows=24&api_key=REDACTED`
- Captured: 2026-04-15
- Purpose: Baseline Smithsonian search payload for client schema parsing and provider search mapping tests.

### `content.ld1-1643400021979-1643400026497-0.json`

- Source URL: `https://api.si.edu/openaccess/api/v1.0/content/ld1-1643400021979-1643400026497-0?api_key=REDACTED`
- Captured: 2026-04-15
- Purpose: Baseline Smithsonian content payload for client parsing and provider asset mapping tests.

## Refresh Template

When replacing or adding fixtures, document:

- Source URL used to capture the payload
- Capture date
- Purpose of the fixture in tests
- Any manual edits or normalization applied after capture
