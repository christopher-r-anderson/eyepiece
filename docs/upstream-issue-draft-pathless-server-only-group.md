# Draft: TanStack Router issue — pathless route group with only server-only children mismatches client routing

> Draft for filing at https://github.com/TanStack/router/issues — review, build the
> minimal repro repo, and file manually. Delete this file after filing.

**Title:** Client router matches a pathless layout route for unrelated paths when its only descendant is a server-only route, causing hydration mismatch

## Which project does this relate to?

Router / Start

## Describe the bug

When a pathless layout route (route group with a `route.tsx`) has **only
server-only route files** beneath it (routes defining `server.handlers` with no
component — e.g. an auth-callback endpoint), the client router matches the
pathless layout for unrelated paths. Loading `/` produces client-side matches
`['__root__', '/(token-callbacks)']` with no leaf, while the server correctly
matches and renders the index route — so React reports a hydration mismatch and
regenerates the tree on the client.

Adding any client-visible child route under the group (e.g. a plain layout
`route.tsx` one level down) restores correct matching.

## Reproduction shape

```text
src/routes/
  (public)/(pages)/index.tsx        # normal index route for /
  (token-callbacks)/route.tsx       # pathless layout (headers-only options)
  (token-callbacks)/auth/confirm.ts # server-only: server.handlers GET, no component
```

- Server render of `/`: matches `/(public)/(pages)/` (correct).
- Client hydration of `/`: `router.state.matches` = `['__root__', '/(token-callbacks)']`.
- React hydration error: server HTML (`<main>` from the public pages layout)
  does not match client render (empty Suspense from the token-callbacks match).

Removing `(token-callbacks)/route.tsx`, or adding a client-visible
`(token-callbacks)/auth/route.tsx` layout between the group and the server-only
file, both eliminate the mismatch.

## Versions

- @tanstack/react-router / react-start 1.166.2 (reproduced in dev and in a
  production Netlify build)
- React 19.2.4

## Possibly related

- #3843 (pathless layout route incorrectly treated as matchable)
- #5304 (route group rendering bug with route.tsx + (folder)/index.tsx)
