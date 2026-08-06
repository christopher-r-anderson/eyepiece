# User lists read snapshots, not the providers

Status: accepted, 2026-07-30

## Context

Eyepiece sources content from two third-party media APIs: the NASA Image and
Video Library and Smithsonian Open Access (filtered to the National Air and
Space Museum). Eyepiece does not own that content and has no relationship with
either institution.

Four constraints shape the options:

- Neither provider is a partner. There is no contract, no negotiated quota, and
  no support channel, so request volume has to stay modest.
- NASA publishes no bulk export and no change feed, so the only way to learn
  that a record changed is to ask for it again. Smithsonian publishes bulk
  metadata weekly on GitHub and a public S3 bucket, which means the two
  providers support different integration options.
- Favorites and collections are lists of arbitrary length. Neither provider
  offers a batch lookup by id, which means N upstream requests on a common user
  page.
- User pages have an implicit expectation to be visible and usable when a
  provider is down, rate limiting us, or has removed a record.

The type of content plays a role here, too. These are archival, public images. A
NASA photograph from 1969 is unlikely to get a new title and the cost of
metadata being temporarily stale is minimal compared to something like pricing
on an e-commerce site.

## Decision

Public browsing goes straight to the providers on demand and leans on CDN
caching: both the documents and the app's own provider-backed API responses
carry short public CDN lifetimes. Search, asset detail, and album pages hold
nothing locally.

User-owned lists read local data. `asset_preview_snapshots` stores the title,
description, and the available images (urls and dimensions) for each asset a
user has favorited or collected, keyed by provider and external id. Favorites
and collection items reference these snapshots rather than the provider.

A snapshot is written when a user first stars or collects an asset, and
refreshed on that same path once it is past a staleness window. Reads remain on
the fast, local, read-only path. A weekly workflow (`revalidate-snapshots`)
ensures that local data staleness remains bounded.

### Differences from a cache

This model is distinct from a standard cache. A cache can treat missing data as
a performance cost because the source can always be asked again. This table
exists for when the source cannot be asked, or no longer has the record.
Favorites and collections pages render without any upstream calls, and,
crucially, a starred or saved item's title and metadata stay available beyond
upstream removal, not just through an outage.

Because of this, snapshot record deletion is explicitly disallowed by the model.
`favorites` and `collection_items` both reference the table with
`ON DELETE RESTRICT`, and a refresh leaves a row alone when the record has
vanished upstream instead of clearing it.

Refresh follows the same rule. It is an optimization over data we already hold,
so it can be skipped, deferred, or fail, and the page still renders.

## Alternatives considered

### Ingest everything and serve locally

Mirror both providers' full catalogs into an owned index, with or without also
mirroring the image files. This approach provides a lot of benefits: no provider
dependency while serving, our own cross-provider indexing and relevance ranking,
and no rate limits.

However, the cost is large, and the approach was rejected on its return combined
with the shortcomings in the NASA API. It would be a per-provider ingest
pipeline: Smithsonian's bulk dataset would support it, but NASA has no bulk
export and so that half would need periodic re-harvesting over the API to detect
changes - leaving the request volume issue unsolved. Even without storing
images, the indexing needs and the development and maintenance cost of an entire
ingestion pipeline would rival the site itself. Worth revisiting if a NASA
change feed becomes available or if site value grows to justify the added
financial and maintenance cost.

### Pure passthrough, no local storage

Always fetch data from upstream, including the contents of a favorites list.

Rejected because it fails two of the constraints at once: N requests per list
render, and a favorites page that is missing data during a provider outage or
asset removal from the upstream catalog.

### A read-through response cache

Cache raw provider responses by request, with a TTL, in front of everything.

The CDN already caches the app's own API responses, for direct entry and in-site
navigation alike, so a read-through layer only adds warmth behind CDN misses. At
this traffic level it would also need to be persistent to be any warmer than the
CDN, since a per-instance memory cache dies with every cold start. And it would
still not make favorites and collections durable, because an evictable cache
cannot be the only copy of a user's list. As a durable provider-response cache
behind the CDN, it remains a potential future improvement.

### Storing only the provider key on favorites

Keep `(provider_id, external_id)` on the favorite and fetch previews in a batch
when the list renders.

Rejected for the same durability reason, and because neither provider offers a
batch lookup by id, so it is still one request per item.

## Consequences

### Accepted

- Two code paths map the same asset: a live provider response on a detail page
  and a stored row on a favorites page. They can disagree, and the cost of that
  disagreement is a stale title or image.
- Snapshots outlive the records they describe. When a provider withdraws an
  asset, the user keeps a preview of something no longer reachable, which is
  preferred over the list losing an entry.
- A snapshot can hold no image at all, and those tiles render empty rather than
  with a stand-in image. A stand-in would give the justified grid an aspect
  ratio to lay out on that does not correspond to a real image.
- A refresh never clears the stored image references, because the provider
  contract does not currently distinguish a record with no media from an
  intermittent lookup failure. The cost is that an image fully removed upstream
  keeps its stale image list while the row stays referenced. The trigger for
  revisiting this is recorded in docs/Providers.md.
- Public pages inherit provider latency and availability. CDN caching and
  build-time prerendering of the entry pages mitigate this. Other pages pay
  provider round trips on a cold render.
- Staleness is bounded by the weekly revalidation schedule. This is acceptable
  because the content is archival. The same design on fast-moving content would
  need a shorter refresh loop.

### Outstanding

- Identity and payload share one table, so the rows other tables reference are
  the same rows whose columns change when the preview shape evolves. #194 shows
  what that costs in practice.
- In-app navigation to a page whose API responses are not warm in the CDN pays
  the full provider round trip, and at current traffic that is the common case.
  The durable provider-response cache described in the alternatives is the
  candidate improvement.
