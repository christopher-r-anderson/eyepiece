# Provider fixtures

Recorded NASA and Smithsonian responses, replayed to the e2e suite so it does not depend on either API being up.

Server-side provider calls happen during SSR, where `page.route` cannot reach them, so the seam is `providerFetch` (`src/integrations/provider-fetch.ts`). `PROVIDER_FIXTURE_MODE=replay` serves these files and fails on a miss; the Playwright web server sets it.

One file per upstream URL. The name is the URL with the api key redacted, plus a hash of that redacted URL, so a rotated or per-developer key resolves the same fixture.

## Re-recording

```
pnpm test:e2e:record
```

That runs the suite against the live APIs and writes every response it sees. Recording only adds and overwrites; delete the directory first if you want to drop files for URLs the suite no longer requests.

Re-record when a spec starts requesting a URL that is not here yet, which shows up as a `No provider fixture for ...` error naming the expected filename. Records are also worth refreshing when a provider changes a response shape we parse, since that is the drift these files would otherwise hide.

## Captured

- 2026-07-28, from a full suite run: NASA search and album responses for the homepage strips and the search specs, Smithsonian search responses for the all-scope and provider-scope specs, and empty results for the synthetic ids the not-found and seeded-fixture specs request.
