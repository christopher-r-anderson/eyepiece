# Entry pages prerender at build time

Status: accepted, 2026-08-02

## Context

Entry page load time is critical for user satisfaction and minimizing initial
bounce rates. For this site, the primary entry point for first-time visitors is
the homepage, and the curated pages it links to are potential secondary entry
points once search engines index them. Serving them means booting a serverless
function, calling the providers, and rendering the markup. CDN caching, the
initial line of defense against a slow render, relies on traffic to keep it
warm. This site gets very little traffic, so most visits arrive on a cold cache
and pay the full cost.

Prerendering is the standard second defense for pages like these: move the page
generation to the project build process and serve static files from the edge,
with no function and no provider calls on the request path. Because these pages
read curated, database-driven content at build time, and that content ships with
releases, a prerendering build has to run after the database is provisioned for
the release.

The existing pipeline couldn't provide that ordering. Netlify built at push, in
parallel with CI, with auto-publish locked; CI ran checks, migrated the
database, provisioned the showcase content, and then located the already-built
deploy and published it.

| Platform       | checks phase | content phase     | publish phase   |
| -------------- | ------------ | ----------------- | --------------- |
| GitHub Actions | validate     | provision content | request publish |
| Netlify        | build        | —                 | publish         |

Because the build did not require provisioned content, it could happen in
parallel on Netlify's platform. However, prerendering required the build to
happen explicitly after the provisioning. This forced both a change in build
ordering and a time gap between provisioning the data and having a publishable
build that matched it.

## Decision

The decision to add a prerendering step was clear, but it came along with two
consequences:

1. the build has to run after provisioning, so CI takes over the production
   build; and
2. the build renders database reads into the artifact, so removals have to hide
   before it runs.

### Entry pages prerender at build time

The content of the entry points above (the home page and the curated album and
public collection pages it links to) is known at build time, so those pages can
be prerendered - the next section covers the ones that end up excluded anyway.
The page set is an explicit list plus a crawl filtered to those sections. The
crawl is required because collection ids exist only in the database. Automatic
path discovery stays off because it sweeps auth and dev routes, and because the
prerenderer follows redirects and saves the destination page under the original
path.

The prerenderer fetches pages over HTTP from a real preview server, so the app's
own API self-fetches work at build time and streamed sections finish before the
HTML is written, baking fully settled pages. Prerendering is gated by
`PRERENDER=1`, which only the publish job sets - local, preview, and e2e builds
stay network-free.

### Homepage links that are not prerendered

By default, the crawl reaches more than the prerender set. The other pages the
homepage links to are filtered out of the crawl and stay server-rendered, each
for its own reason:

- Search result pages: result pages are deliberately noindexed (standard
  practice for internal search), and an in-app search is a client-side
  navigation that never requests a document, so the only document traffic a
  prerendered result page could serve is cold entry from a shared link - an
  accepted consequence served by the normal SSR path. These URLs also could not
  prerender as they are: static file lookups ignore query strings, so every
  result page would collide at one file (both the path-based workaround and a
  static search shell are weighed in the alternatives).
- Album pages: album ids are case-sensitive, mixed-case NASA ids, and the CDN
  301 redirects any static HTML URL to lowercase. A page prerendered at its
  mixed-case path still serves its baked HTML after that redirect and looks
  correct, but the app then hydrates with the lowercased id from the URL,
  refetches, and errors after paint. Prerendering at lowercase paths instead
  just moves the failure to build time, where the fetch with a lowercased id
  bakes a not-found page. So only lowercase URL spaces prerender: a prerendered
  page's URL must survive the CDN's canonicalization unchanged, or hydration
  diverges from the baked state.
- Asset detail pages: each one costs provider calls at build time and the set is
  practically unbounded. Detail pages that become entry points through search
  indexing or sharing get most of their traffic served by the CDN after the
  initial hits.

### Prerendering moves the production build into CI

The build has to run after provisioning, so it moved from Netlify into the CI
pipeline that owns the provisioning. After checks, migration, and provisioning,
CI runs the production build and uploads it with
`netlify deploy --prod --no-build`. The deploy that publishes is the one CI just
built, so there is no separate deploy to find or verify. The auto-publish lock
stays as protection against accidental UI-triggered publishes: the publish step
unlocks, deploys, and re-locks in a step that always runs, so an aborted run
cannot leave the site unlocked.

### Removals hide before the build and delete after publish

The time gap between provisioning and publish is where removals get complicated,
because the build renders its database reads into the artifact. Publishing
already held two invariants:

1. content changes apply before publish, so a new page never links content that
   does not exist; and
2. deletions prune after publish, so a failed publish never leaves the live page
   linking deleted content.

The build now runs between those phases, which means one database serves two
site versions during every transition.

On a removal, every ordering leaves some page with a dead link for some window,
and so the question becomes: which page, for how long, and what failure looks
like. This process keeps removed collections out of the build by hiding them
rather than deleting them before it runs - the removal takes effect in the new
pages without a destructive step mid-transition. Deletion waits until after
publish, when no live page links the collection. The outgoing page can 404 on a
removed collection for the few minutes between apply and publish, a failed run
leaves the collection hidden but recoverable, and re-adding it restores it
through the normal path.

### The sitemap is a server route

TanStack Start can emit a sitemap from a prerender run, and on a site where the
prerendered pages are the whole site, that is the right source. Here the two
sets differ: the sitemap should carry every public collection, including
user-created ones the homepage never links, and the album pages that cannot
prerender still belong at their canonical URLs. (The plugin's crawl-based
sitemap also includes links the prerender filter rejected.) So the sitemap is a
server route that enumerates the complete indexable set per content type: home,
the curated albums at their canonical URLs, and every public collection, paged
past the API response cap. Search pages are excluded, matching common practice
for internal search.

## Alternatives considered

### Harden the coordinated pipeline

The first implementation kept Netlify as the builder: skip push-triggered
production builds, have CI fire a build hook after provisioning, and poll for
the resulting deploy. It was implemented and reviewed, and each review round
found another race in CI identifying a deploy it did not create: first a commit
filter, then a freshness cutoff for re-runs, then a window the cutoff left open.
The races were all in the coordination itself, so moving the build into CI
removes the problem instead of patching it. Discarded before merge.

### Rebuild only when provisioning changed

A latency optimization for publishes that do not touch content. On removals it
still publishes the dead state first, and the complexity buys back part of one
build's worth of time. Not deemed worth the cost; revisit if time-to-publish
improvements become a priority.

### Incremental regeneration

TanStack Start documents an ISR pattern that keeps build-time prerendering and
adds `stale-while-revalidate` cache headers, so a CDN serves cached pages while
revalidating them against the origin in the background. Regeneration happens
only where that revalidation reaches an origin that re-renders the page
instead of serving the baked file. On Netlify a prerendered page is a static
file and the file is the origin: revalidation returns the same bytes, and only
the next deploy changes them. Real regeneration here would mean taking
pages off the static output so requests reach the server function, then caching
its responses at the CDN. That trades the static guarantee for a second HTML
freshness domain with its own invalidation story, and the gain is a narrower
stale window on the first view: hydration starts a background refetch of stale
data, so the baked content lasts until that request lands rather than until
the next deploy. Not worth the second freshness domain for that window;
revisit if first-view freshness between deploys becomes a need the client
refetch cannot cover, starting from the cache-header middleware in
[the public caching decision](01-public-caching.md) rather than a new
mechanism.

### Other removal orderings

Hiding removals only after publish bakes the removed collection into the new
page, which is the original bug. Per-deploy visibility snapshots would mean
maintaining two views of the database for a transition window.
Prune-then-rebuild-republish means two deploys per removal and still publishes
the dead state first.

### Path-based curated search pages

While standard search results are deliberately `noindex`, curated search result
pages - such as those linked from the homepage - could be considered candidates
for prerendering. Since query strings can't map to prerendered static files,
prerendering these search result pages would mean giving curated searches
path-based URLs (`/prefix/some-topic`). It is commonly used with
pseudo-category, keyword driven landing pages such as in e-commerce. It needs a
canonical mapping between two URL forms for the same query, management of
redirects, and policy and code support for managing historical changes.
Additionally, it couples the generic search page to the curation module.
Currently this site does not treat the content of homepage linked search results
as any different than standard search result pages, nor does it use search
result pages as shared landing pages in other contexts such as social media or
email campaigns. Therefore, the added complexity and ambiguity of canonical URLs
is considered a net negative for the current site. A static `/search` shell
(instant shell load, client-side fetch for any query) is reserved as another
potential alternative if consistent initial page load becomes preferred over
relying on a CDN that is too frequently cold.

### A CMS driving content publishes

With a content team, the curated albums and collections would live in a CMS, and
its publish events would drive republishing through hooks, decoupling content
changes from code deploys. That is the expected shape wherever content editors
and developers are separate roles, and it would also dissolve the staleness and
removal-window consequences below, since content would publish on its own
schedule. Here, the curation module in the repo is a deliberate CMS stand-in:
content changes are release-shaped by design, and a CMS integration is more
infrastructure than a single-maintainer site warrants. Worth revisiting first if
content updates ever need to outpace deploys or if separate content maintainers
join the project.

## Consequences

- Time to publish grows by roughly one build, since the production build no
  longer runs in parallel with the CI checks. Netlify pricing meters production
  deploys rather than build minutes, so build location is cost-neutral.
- Production ships the same kind of artifact that e2e already tested. Previously
  Netlify separately rebuilt what shipped, so this increased test/prod fidelity
  rather than reducing it, though it now differs from the infrastructure used to
  build PR preview deploys.
- Prerendered pages are tied to builds and can therefore go stale between
  deploys. Accepted as a sufficient trade-off for the project's current needs. A
  scheduled rebuild was considered and cut: the content is archival, so the
  drift a rebuild would correct is cosmetic, and shortening that window is not
  worth a recurring full pipeline run.
- Deploy previews serve SSR where production serves static files, since the gate
  keeps preview builds network-free. Static is additive over a working SSR
  fallback, so the difference is speed, not behavior.
- Removals carry a short 404 window on the outgoing page. This was deemed a low
  frequency scenario with a short invalid state and a page status (404s on
  removed items) that properly represents the underlying data.
- The lowercase constraint was found by probing the live CDN after the first
  prerender deploy because the local Netlify server emulation does not
  case-normalize. Post-deploy verification against the real CDN is part of
  shipping prerender changes.
- Pages that stay SSR still pay the cold function and provider round trips on a
  first document load. That cost is now confined to those pages instead of every
  page.
