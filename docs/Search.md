# Search

## Scoped Search Model

One search box everywhere. The provider is a scope owned by the URL, not a
pre-search choice:

- `/search?q=moon` - the default "All libraries" scope
- `/search?providerId=nasa_ivl&q=moon` - a provider scope
- `/search?providerId=nasa_ivl&q=moon&yearStart=1990` -
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
navigation (crawlable hrefs, middle-click, back button).

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

P4 also applies across fields: an inverted year range (`yearStart` >
`yearEnd`) drops as a pair.

The API route (`/api/v1/search`) stays strict and returns 400s: bad params
from an API caller are a programming error; a mangled URL from a person is
not.

## Canonicalization

Equal searches resolve to a single spelling per document so the CDN caches
one key per document. URLs the app generates are already canonical: the
router serializes all search params through `stringifyCanonicalSearchParams`
(`src/lib/search-params.ts`), which sorts keys and omits empty-string
values. URLs from outside - shared links, hand edits, native form submits -
converge in two tiers.

The server tier is the search route's own `beforeLoad`: any document
request whose raw query string differs from the canonical spelling - key
order, encoding (`+` for spaces), empty-valued params, values the
validator rewrites (a padded `q` lands trimmed), and keys it drops (junk
params, invalid or inverted year values, unknown `providerId`) - takes a
307 to the canonical spelling. The redirect carries no cache headers
(thrown redirects bypass the route's `headers()`; curl-pinned), so the
CDN never caches it; it works without JavaScript and costs one origin
round trip. The route owns this tier since router 1.170, which dropped
the framework's built-in normalization redirect (and that one never
covered dropped keys anyway - those used to serve 200s under their own
CDN keys).

`useCanonicalSearchReplace` is the client tier for non-canonical
spellings reached without a document load, replacing the address bar via
`history.replace`. It stands down while an asset overlay masks the URL.
Auth-modal state travels in history state, not search params; legacy auth
params (`auth`, `fp`) and one-shot form params (`next`, `formError`,
`status`) are dropped as junk.

| Spelling                            | Fixed by                  | CDN                   |
| ----------------------------------- | ------------------------- | --------------------- |
| any non-canonical, on document load | server 307 (`beforeLoad`) | redirect never cached |
| any non-canonical, client-side      | client replace            | -                     |
| canonical                           | -                         | the one key           |

Native (pre-hydration) form submits ride the server tier. A GET form
serializes every named field in document order, so the search bar pre-sorts
its hidden scope fields around the `q` input and scope-only submits spell
canonically with no redirect. The named year inputs sit in visual order
(From before To, against the key-sorted `yearEnd`-first spelling) and
submit even when empty, so a NASA-scope submit takes the one 307:

    /search?providerId=nasa_ivl&q=mars&yearStart=1970&yearEnd=
    -> 307 -> /search?providerId=nasa_ivl&q=mars&yearStart=1970

Constraints the client tier depends on:

- compares raw URL strings, not parsed objects: variants that parse equal
  are still distinct cache keys, and the router drops order-only object
  replaces via structural sharing (hence the history-level replace)
- the raw side is never the router's `location.searchStr` (a re-serialized
  parse result, it always reads as already canonical). The server tier
  reads the request URL (`getRawSearch`, server-only); the client tier
  reads `router.history.location.href`, which updates synchronously with
  pending writes included - `window.location` lags the browser history's
  deferred (microtask) DOM writes, and a navigation commit inside that
  window once replace-looped to React's update-depth limit
- the target derives from one `state.location` snapshot; mixing in
  `Route.useSearch()` tears during navigation transitions and cancels
  in-flight navigations
- the parse is idempotent (unit-tested), so the canonical string is a
  fixed point, and a client replace lands in `history.location`
  synchronously, so the next check early-returns - neither tier can loop

## The All View

`AllProvidersResults` renders one section per provider with the top results
and a "See all from {provider}" link into the scoped tab. Rules it depends
on:

- sections read the same infinite query as the scoped tab through a top-N
  `select`, so "See all" and returning to All render from cache; any drift
  in the query key reintroduces a double fetch (guarded by the key-parity
  test and the e2e request-count assertion)
- the loader fires the all-scope prefetches without awaiting: queries
  stream as they settle, so TTFB and healthy sections never wait on the
  slowest provider. Don't switch to `ensureInfiniteQueryData` - a rejection
  there takes down the whole page instead of one section
- sections fail alone: sibling Suspense and error boundaries per section,
  inline alert instead of the route error page

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
6. Scope tabs stay links, not ARIA tabs (scope changes are navigations)
7. Behavior within a provider scope (filters, infinite results) and API
   validation unchanged
