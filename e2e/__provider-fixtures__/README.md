# Provider fixtures

Recorded NASA and Smithsonian responses, replayed to the e2e suite so it does not depend on either API being up.

Server-side provider calls happen during SSR, where `page.route` cannot reach them, so the seam is `providerFetch` (`src/integrations/provider-fetch.ts`). `PROVIDER_FIXTURE_MODE=replay` serves these files and fails on a miss; the Playwright web server sets it.

One file per upstream URL. The name is the URL with the api key redacted, plus a hash of that redacted URL, so a rotated or per-developer key resolves the same fixture.

Each file records the status alongside the payload, so a spec that exercises an upstream error replays as that error rather than as a fixture miss:

```json
{ "status": 200, "body": { "collection": {} } }
```

A response that is not JSON is stored as `text` instead of `body`.

## Re-recording

```
pnpm test:e2e:record
```

That runs the suite against the live APIs and writes every response it sees. Recording only adds and overwrites. A full replay run (`pnpm test:e2e`, which sets `PROVIDER_FIXTURE_AUDIT=1`) fails at teardown naming any file nothing read, so drop those files rather than the directory. Focused runs through `pnpm exec playwright test ...` skip that check, since the specs they leave out would make their recordings look unread.

One recording is exempt from that check and listed in `e2e/support/fixture-guard.teardown.ts`: a search the year-edit specs stub client-side, which Firefox sometimes lets through to the server anyway. Deleting it would turn that escape into a miss. #305 removes the stub instead.

Re-record when a spec starts requesting a URL that is not here yet, which shows up as a `No provider fixture for ...` error naming the expected filename and the request that asked for it. Records are also worth refreshing when a provider changes a response shape we parse, since that is the drift these files would otherwise hide.

The Playwright web server runs with router intent preloading off (`VITE_ROUTER_PRELOAD_ENABLED=false`), so a hovered tile never asks the provider for an asset no spec navigates to; only real navigations need recordings.

## Captured

- 2026-07-28, from a full suite run: NASA search and album responses for the homepage strips and the search specs, Smithsonian search responses for the all-scope and provider-scope specs, and empty results for the synthetic ids the not-found and seeded-fixture specs request.
- 2026-08-13, Smithsonian only: search responses re-recorded under the media_usage:CC0 query term, plus the content and IIIF info.json responses the head specs' asset page requests.
- 2026-09-02, pruned: three NASA asset responses that only hover preloads or a since-stubbed synthetic id had requested, once preloading was off under e2e and the teardown started reporting unread files.
