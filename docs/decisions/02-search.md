# Search scopes by provider and defaults to All

Status: accepted, 2026-07-09

## Context

The app searches two providers with different filter surfaces. The original UI
required a provider to be selected before a search could run, and the URL schema
enforced it strictly. Initial motivation for this included the inability to
meaningfully rank search results from multiple providers on the fly and an
unwillingness to visually rank the providers themselves by always stacking one
above the other. This resulted in a barrier to initial search, scoping on
results pages that can be unclear to users, and the inability to gracefully
handle search URLs with missing providers.

Users should be able to interact with the site with the least amount of
friction. Being required to choose a provider before seeing results increases
that friction and therefore contributes to bounce rate.

Selecting a provider on search entry and then having the results page collapse
to a single provider risks the user becoming scoped to that provider on further
searches without a clear awareness.

Finally, search URLs are shared, copy-pasted, and hand-edited. A URL with a
clear search intent but a missing provider should not cause a hard error or a
further decision point by the user.

Research backed these concerns and provided the industry best practice for
dealing with this scenario. Pre-search source selection is a documented
anti-pattern, and a scoped search should default to all sources (NN/g
scoped-search guidance, Baymard's search-scope research). Blending unindexed
live results from independent APIs has no legitimate combined query-time ranking
when there are no quantitative attributes like dates or prices to merge on. The
appropriate user experience is an all-sources view in the style of the bento
pattern: labeled sections per source, as seen in LinkedIn's all-results search,
Spotify's web player, and the university library search pages that named the
pattern.

## Decision

One search box everywhere. The provider is a scope owned by the URL, defaulting
to All, presented as tabs on the results page. The All view is sectioned per
provider, top results plus a see-all link, with no cross-provider interleaving.
The scope tabs are links styled as tabs rather than ARIA tabs, because switching
scope is a navigation: crawlable HREFs with support for native features like
middle-click and back buttons.

Owning the scope in the URL makes the URL itself an interface, both for people
who share and edit links and for the CDN that caches by them. The URL grammar is
flat query parameters matching the API wire contract. Parsing is lenient at the
boundary and strict after: the route parser never throws, salvages per key, and
produces a strict scope model that nothing downstream has to re-check. An
unknown provider falls back to All, invalid filter values drop individually, and
a missing or empty query is a prompt state. The dividing line is what a
parameter does: a provider id in an asset detail path names the resource, so a
wrong one is honestly a 404, while the same id in a search query string only
shapes the view, and the page can always render something sensible instead. The
API route underneath stays strict and returns 400s, because bad parameters at
the internal API layer indicate a missed validation or normalization error.

Equal searches converge to a single canonical spelling, with keys sorted and
empty values omitted, so the CDN caches one key per search. URLs the app
generates are canonical by construction. URLs from outside converge through a
server redirect on document requests and a client-side history replacement after
in-app navigations.

There is no legacy URL support. Pre-1.0 there are no external links worth
preserving, and old spellings degrade through the same per-key salvage as any
other malformed URL.

## Alternatives considered

### Keep provider-required search and degrade bad URLs to a prompt

The first implemented fix kept the provider-required model and answered a URL
without a valid provider by rendering the provider picker with the query
prefilled, instead of an error page. It was closed unmerged: a shared link would
land on a decision point instead of results, the results page would sometimes be
a chooser rather than results, and the happy path still scopes the user to a
single provider without a clear signal.

### Interleaved cross-provider results

A single merged list needs an order and any ranking would be arbitrary across
two indexes that score relevance differently. Merging at query time only works
on objective attributes, and photo relevance is not one without an index.

### An owned search index

Harvesting both providers into one index enables blended ranking but was
rejected for the reasons in the provider-data decision: one provider publishes
no bulk data, so half the index would be built by re-crawling an API, and the
ingest system outgrows the site.

### Nested provider-scoped params

Filters could nest under a provider key as one structured value. Flat parameters
won on legibility, on per-key salvage (a broken value drops alone instead of
taking the whole filter object with it), and on canonicalization, since
structured values admit spelling variance that no CDN can normalize. The API
wire contract was already flat.

## Consequences

- The All view runs one query per provider. The section queries share the query
  cache with their scope tabs, so opening a tab after the All view refetches
  nothing.
- Sections fail independently. A provider outage degrades its own section behind
  its own error boundary, and the rest of the page renders.
- Salvage is silent: a URL with an unknown provider or a bad filter value
  renders a working page with the value dropped, so a person may not notice they
  are seeing broader results than the link intended. Accepted, because the
  alternative errors the whole page.
- The All view avoids implying a ranking that does not exist, but sections still
  render in some order, so one provider always sits above the other. The order
  is fixed and labeled, constant across queries, which makes it a presentation
  order rather than a relevance claim. This soft prioritization is the accepted
  remainder of the original concern about visually ranking providers.
- Non-canonical document hits pay one redirect hop before the CDN can serve
  them.
- A new provider adds a section, a scope tab, and a filter schema. The mechanics
  live in docs/Providers.md and docs/Search.md.
