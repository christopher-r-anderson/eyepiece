# Cache policy follows route audience

Status: accepted, 2026-07-07

## Context

Pages are server-rendered on Netlify with a CDN in front. Caching anonymous
document traffic at the CDN is standard practice and the main performance lever
for a content site, but any response that depends on a user's session must never
be publicly cached, because the CDN would serve one user's page to another. The
app organizes audiences in different branches of a single route tree: public
browse pages, private account pages, and auth token callbacks.

A header that is wrongly private wastes cache, while a header that is wrongly
public is a data leak, so the goal was to make the safe outcome the default and
the unsafe one hard to express, rather than relying on every route getting it
right individually.

## Decision

The route tree is partitioned by audience: `(public)`, `(private)`, and
`(token-callbacks)` subtrees, each rooted at a policy boundary. Boundaries are
factories (`publicBoundary()`, `authenticatedBoundary()`,
`privateAnonymousBoundary()`) that return complete route options coupling cache
headers with auth behavior. The policy keys are typed `never` on the factory
input and merged last, so overriding a subtree's policy is a type error rather
than a silent spread replacement. The default posture is `private, no-store`.
Public caching is an explicit opt-in at the `(public)` root.

The user-scoped Supabase client is never placed in router context. All access
goes through one isomorphic factory, `createUserSupabaseClient()`, which builds
a per-request client on the server and returns a browser singleton on the
client. Since capability is not threaded through the tree, route position cannot
accidentally hand a user session to public SSR.

Public documents do not branch on user identity. Signed-in affordances on public
pages are client islands rendered after hydration, so the same cached document
serves every visitor whether they are signed in or not.

Enforcement is layered underneath the declared intent:

- Lint blocks importing the user client inside `(public)` routes, and raw
  cache-header string literals in route files.
- A runtime tripwire marks any server-side session read through an
  `AsyncLocalStorage` sentinel and downgrades a session-reading response to
  `private, no-store`, reporting a policy violation when the response had
  declared itself public. The boundary declares what a subtree intends and the
  tripwire checks that the render actually matched it.
- Error documents and API error responses are always `private, no-store`, so a
  failed render cannot sit in the CDN for the full public TTL after the problem
  recovers.
- Any response that sets an auth cookie is forced private regardless of route
  configuration.

Public responses emit both a portable `Cache-Control` and a
`Netlify-CDN-Cache-Control` with the durable tier, so browser and CDN lifetimes
are controlled separately and the portable header still works if the CDN
changes.

## Alternatives considered

### Per-route headers by hand

The default approach: each route declares its own cache headers. Every new route
re-decides policy, and nothing connects the headers a route declares to whether
its render actually read a session. That connection is the thing that needs
enforcing, and the boundary plus tripwire pairing checks it from both
directions.

### User capability in router context

Threading the user client through router context is the natural shape in
TanStack Start, but it makes user capability ambient: any route in the tree can
reach it, and whether a public page uses it becomes a code-review question
instead of a structural one. The factory keeps capability out of the tree
entirely.

### Server-rendered personalization with cache bypass for signed-in users

Render user state into documents and skip the CDN when an auth cookie is
present. This forfeits caching for every signed-in visitor, and the leak risk
survives at the classification edge, since a page marked public that reads the
session by mistake still leaks. User-agnostic documents stay cacheable for
everyone. The cost is deferred personalization, noted below.

### No public caching at all

The obviously simpler approach with zero risk of a shared cache leak is to avoid
CDN caching altogether. However, rendering these pages means paying provider
response times on top of a noticeable render time of their own, and without the
CDN that combined cost stops being the cold-cache worst case and becomes the
experience of every visit. That was difficult to defend.

### Caching all page shells and hydrating user content everywhere

Switch to client islands as a global rule: serve every page, signed-in ones
included, as a cacheable user-agnostic shell and fetch all user content after
hydration. Every document becomes cacheable, but signed-in pages give up SSR
entirely. The first paint of a favorites page becomes an empty shell and a
loading state rather than streaming in the actual list in the same round trip as
SSR does. Auth also moves client-side, replacing the server redirect with a
flash of shell before navigation. Private documents are per-user traffic anyway,
so caching their shells saves a function invocation and costs the content.

## Consequences

- On initial entry, public pages render as they would for an anonymous user.
  After hydration, the signed-in header state appears when applicable. The
  layout must reserve space for anything that appears after hydration so the
  swap does not shift the page content (CLS), and every signed-in affordance on
  a public page carries that requirement.
- Mistakes fail toward lost caching, and that failure is invisible to users: a
  tripwire downgrade costs cache hits without changing what anyone sees, so
  violations only surface through the observability report it files.
- There is one case the runtime cannot reach: headers go out when the body
  starts streaming, so a session read inside a deferred segment happens after
  the tripwire's check and is neither downgraded nor reported. The lint layer
  still applies there, and public pages have no reason to put a session read in
  deferred data in the first place, but that edge is held by lint and the merge
  checklist in docs/RoutePolicy.md rather than by the runtime.
- Every new route starts by choosing an audience subtree, and a route that
  chooses nothing is private by default. Changing a page's audience later means
  moving its file across subtrees.
- The URL space is split across parallel directories: routes under
  `(private)/(pages)` and `(public)/(pages)` serve sibling URLs from directories
  that are not siblings, so no single directory listing shows every route and
  reading the full route map means walking the subtrees in parallel. A path
  claimed in two subtrees is at least caught at route generation, which errors
  on the conflict.
- Because public documents never read a session, they are exactly the pages a
  build can render ahead of time. Prerendering the entry pages (see the
  prerendering decision) followed later and required no changes to this model.
