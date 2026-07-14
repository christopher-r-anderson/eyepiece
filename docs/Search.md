# Search

## Scoped Search Model

One search box everywhere. The provider is a scope owned by the URL, not a
pre-search choice:

- `/search?q=moon` - the default "All libraries" scope
- `/search?providerId=nasa_ivl&q=moon` - a provider scope
- `/search?mediaType=image&providerId=nasa_ivl&q=moon&yearStart=1990` -
  provider filters, flat in the query string (params always key-sorted)

### Why this shape

- Pre-search source selection is a documented anti-pattern; scoped search
  should default to "all" (NN/g scoped-search guidance, Baymard search-scope
  research).
- Blending live results across independent APIs is not legitimate without a
  unified index, so the honest "all" view is a section per provider with top
  results and a "see all" link (the NCSU Libraries bento pattern). No
  cross-provider interleaving.

The scope tabs are links styled as tabs, not ARIA tabs: switching scope is a
navigation (crawlable hrefs, middle-click, back button). react-aria
collection components also cannot be SSR'd here - they hydrate from a
`<template>` element that Emotion's SSR style tags corrupt, causing
hydration mismatches.

## URL Parsing

/search URLs are shared, hand-edited, and CDN-cached, so parsing is lenient
at the boundary and strict after. `src/features/search/search-page-params.ts`:

- `searchPageParamsSchema` (the route's `validateSearch`) never throws; it
  salvages per key and emits the flat `SearchPageParams` wire shape
- `toSearchPageState` produces the strict scope model (`all` or `provider`
  plus filters); nothing downstream reads optional fields

The failure taxonomy the parse must satisfy:

| Case | Input                                        | Outcome                              |
| ---- | -------------------------------------------- | ------------------------------------ |
| P1   | no `providerId`                              | All scope                            |
| P2   | unknown `providerId`                         | All scope, canonicalized away        |
| P3   | valid `providerId`, no filter params         | provider scope, filters default `{}` |
| P4   | unknown/invalid/incompatible filter values   | keep provider, salvage per key       |
| P5   | missing or empty `q`                         | prompt state, never an error         |
| P6   | JSON-mangled values (`?q=123` parses number) | coerce                               |

The API route (`/api/v1/search`) stays strict and returns 400s: bad params
from an API caller are a programming error; a mangled URL from a person is
not.

## Canonicalization

Non-canonical /search URLs render normally (the lenient parse guarantees
it), then `useCanonicalSearchReplace` rewrites them once, client-side, to a
single spelling per document so the CDN caches one key per document.
Covered: junk values, stripped defaults (empty or whitespace-only `q`, no
`providerId` on the All scope), and param-order/encoding variants.
Auth-modal params (`auth`, `next`, `fp`) survive. The router serializes all
search params key-sorted (`stringifySearchParams` in
`src/lib/search-params.ts` is its `stringifySearch`), so app-generated URLs
are already canonical.

Constraints the implementation depends on:

- compares raw URL strings, not parsed objects: variants that parse equal
  are still distinct cache keys, and the router drops order-only object
  replaces via structural sharing (hence the history-level replace)
- the comparison and the target derive from one `state.location` snapshot;
  mixing in `Route.useSearch()` tears during navigation transitions and
  cancels in-flight navigations
- the parse is idempotent (unit-tested), so the canonical string is a fixed
  point and the replace cannot loop
- no `beforeLoad` redirect: a `publicBoundary()` route must never CDN-cache
  a redirect response; every spelling serves the content directly

## Cache Policy

/search inherits public cache headers from the `(public)` boundary (see
RoutePolicy.md). Nothing in the SSR document depends on user identity:
scope, filters, titles, and tab selection are pure functions of the URL.
The default tab is fixed and URL-driven - no server-side personalization,
no "remember my tab".

## Merge Checklist

1. `validateSearch` on /search never throws; new params get a `.catch()`
   fallback and a row in the P1-P6 test table
2. New filter params must not collide with reserved names: `q`,
   `providerId`, `auth`, `next`, `fp`
3. Canonical output stays idempotent (`search-page-params.unit.test.ts`
   invariants pass)
4. Navigation payloads are built with `toSearchPageParams` /
   `toCanonicalUrlParams`, never object literals; query strings are built
   with `stringifySearchParams`, never hand-assembled
5. Provider display strings come from `PROVIDER_DISPLAY`
6. No react-aria collection components in SSR'd page chrome
7. Behavior within a provider scope (filters, infinite results) and API
   validation unchanged
