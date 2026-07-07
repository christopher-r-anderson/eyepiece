# Route Policy

## Route Classes

Choose a route class first. The class determines server auth behavior, cache policy, and client auth-command scope.

| Class                | Typical routes                                            | Server user session       | Cache-Control                                               | Client auth commands         |
| -------------------- | --------------------------------------------------------- | ------------------------- | ----------------------------------------------------------- | ---------------------------- |
| Public content pages | /(public)/(pages) subtree                                 | Not used for SSR document | public, max-age=0, s-maxage=300, stale-while-revalidate=300 | Explicit client islands only |
| Auth-form pages      | /(public)/(auth) subtree                                  | Not used for SSR document | public, max-age=0, s-maxage=300, stale-while-revalidate=300 | Whole route content          |
| Private pages        | /(private)/(pages) subtree                                | Required                  | private, no-store                                           | Whole route content          |
| Private auth forms   | /(private)/(auth) subtree (e.g. /auth/update-password)    | Required                  | private, no-store                                           | Whole route content          |
| Public API           | /(public)/api subtree                                     | Not used                  | public, max-age=0, s-maxage=300, stale-while-revalidate=300 | None                         |
| Token callbacks      | /(token-callbacks)/auth subtree (currently /auth/confirm) | Not yet established       | private, no-store                                           | None                         |

## Route Tree Structure

```text
(public)/              ← policy root: null userSupabaseClient, PUBLIC_ROUTE_POLICY, public Cache-Control
  (pages)/             ← content pages: <main> layout, auth modal island,
                          useEnsureProfileExists (client-side check post-hydration)
   (auth)/              ← auth-form pages: card panel layout,
                                       AuthCommandsProvider, useRedirectAuthenticatedUser
   api/                 ← public API endpoints (no React layout);
                                       handlers apply shared public cache middleware directly

(private)/             ← policy root: authenticated, private Cache-Control,
                          UserSupabaseClientProvider + AuthCommandsProvider
  (pages)/             ← content pages: <main> layout,
                          userHasProfile check (server-side, SSR gate)
  (auth)/              ← post-auth flow pages: card panel layout (providers inherited)

(token-callbacks)/     ← source-only namespace; the policy boundary lives one level
                          down (see "Token-callback boundary placement" below)
  auth/                ← token-callback policy boundary: private Cache-Control
    confirm            ← leaf handler at /auth/confirm; parses query params and
                          sets private, no-store on every response/redirect path
```

Public content and auth-form pages remain cache-safe because SSR document output does not branch on user identity.
Authenticated users are redirected away from auth-form pages after hydration via `useRedirectAuthenticatedUser()`, keeping the documents cacheable while avoiding stale server-side cookie branching.

Profile completion is encouraged client-side: authenticated users without a profile are redirected after hydration via `useEnsureProfileExists()`, preserving cache safety while maintaining proactive guidance.

## Boundary Rules

Each policy boundary route file declares:

- Cache-Control header policy for the entire subtree
- Server capability (userSupabaseClient null/non-null) via beforeLoad
- Route policy constant for policy-gated server helpers

Layout routes below each policy root add React-level concerns (providers, HTML structure)
without changing the inherited server policy.

Server boundary behavior is composed from shared boundary definitions in `src/lib/route-boundaries.ts`.
Client command scope remains explicit in JSX (no implicit auto-wrap behavior).

Public API handlers are another exception: route-policy boundaries do not apply
document `headers` to `server.handlers` responses. Public API routes must set
their `Cache-Control` explicitly in shared server middleware.

Token-callback handlers are a partial exception: they do inherit policy from the
`/(token-callbacks)/auth` boundary, but they must still parse request input and
enforce `private, no-store` directly in middleware or in their handler response path.

### Token-callback boundary placement

The boundary lives at `/(token-callbacks)/auth` (a client-visible layout route),
not at the `/(token-callbacks)` group root. Root cause, reproduced empirically
on @tanstack/react-router 1.166: when a pathless layout route's only descendant
is a server-only route file (`server.handlers` with no component, like
`auth/confirm.ts`), the client router matches the pathless layout for unrelated
paths — loading `/` yields client matches `['__root__', '/(token-callbacks)']`
with no leaf, while the server correctly renders `/(public)/(pages)/` — and
React reports a hydration mismatch. Giving the group a client-visible layout
route (`auth/route.tsx`) restores correct matching. If a future token-callback
route needs a different policy, add another client-visible layout boundary
beside `auth/`, and never leave a route group whose only children are
server-only route files.

## Cache Policy vs Cache Profile

Treat these as separate concerns:

- Cache policy (public vs private) is immutable within a policy boundary.
- Cache profile (TTL values) may be tuned per route when needed, but only within the inherited policy scope.

Rules:

- Do not set `routePolicy` in ordinary descendant route files; use a dedicated boundary when cache scope or server capability changes.
- Do not use raw `Cache-Control` string literals in route files.
- Use `getPublicDocumentCacheControlHeader(profile)` for public TTL tuning.
- Use `getPrivateDocumentCacheControlHeader()` for boundary-level private headers.
- Use `buildPublicApiCacheMiddleware(profile)` when a public API handler must enforce public caching on its own responses.
- Use `createPrivateNoStoreHeaders()` / `withPrivateNoStoreCacheControl()` when a server handler must enforce private no-store directly on its own responses.

The default public profile is defined by `DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE` in `src/lib/route-policy.ts`.
Boundary helpers and server-response helpers keep cache strings centralized.

## Server Enforcement

Server-side access to the user Supabase client is policy-gated.

- Public policy: server user client access forbidden
- Authenticated policy: server user client access allowed
- Server code requiring the user client must call requireUserSupabaseClient(context)

This is the hard SSR/cache safety line.

## Auth Guard Behavior

Authenticated guards must handle three cases:

1. Unauthenticated user:
   - Redirect to login with next/redirect target

2. Intentional redirect thrown in auth flow:
   - Rethrow redirect unchanged

3. Unexpected auth-check failure (network/service/runtime):
   - Treat as auth check failure path
   - Redirect safely to login using current location

The login redirect keeps the existing payload semantics:

- `next` is derived from `urlToNextParam(location.href)`
- no explicit status code is added for this redirect path

This keeps behavior deterministic and avoids leaking failures into page rendering paths.

## Client Auth Commands

AuthCommandsProvider exposes useAuthCommands for imperative auth actions.

Command surface:

- login
- register
- resetPassword
- resendRegisterConfirmation
- updatePassword
- logout

Rules:

- useAuthCommands only inside AuthCommandsProvider
- User pages: provider wraps full route content
- Public pages: provider wraps only specific client islands that need commands
- Auth-form pages: provider wraps route content for form actions

Logout behavior:

- On success: rely on `AuthStateSync` (`SIGNED_OUT`) to invalidate route data
- On failure: show a toast (`Log out failed`) and log with `logErrorWithObservability`

## Auth State Sync

Auth state subscription is global and mounted once.

`AuthStateSync` must be mounted exactly once in provider scope where all required hooks are valid:

- query client context
- TanStack Router hooks

It acquires the browser user Supabase singleton lazily on the client. It does not
depend on `UserSupabaseClientProvider`, which remains scoped to authenticated route
subtrees for in-page user-client access.

Responsibilities:

- Listen to auth state changes
- Update auth query cache
- Sync observability user context
- Call `router.invalidate()` after auth changes

Do not mount additional auth subscriptions in route components or islands.

## Public Page User-Specific UI Pattern

User-specific UI on public pages must be client-only.

Pattern:

1. Render SSR-safe fallback content
2. After hydration, render client island
3. Wrap island in AuthCommandsProvider only if commands are needed

Typical examples:

- Header user status/menu island
- Auth modal controller island
- Favorite interactions that become user-aware post-hydration

## Adding New Routes

### New public content page

1. Place route under `/(public)/(pages)/`
2. Use `publicSupabaseClient` for any data loading (no user session)
3. For user-specific UI, use `ClientOnly` islands post-hydration
4. Scope `AuthCommandsProvider` to the island only if commands are needed

### New auth-form page (public, anonymous)

1. Place route under `/(public)/(auth)/`
2. Keep SSR output user-agnostic so the page remains publicly cacheable
3. Use `useRedirectAuthenticatedUser(next)` to redirect logged-in users after hydration when needed
4. Access auth commands via the `AuthCommandsProvider` inherited from the layout

### New private content page

1. Place route under `/(private)/(pages)/`
2. Authentication, `UserSupabaseClientProvider`, and `AuthCommandsProvider` are inherited
3. Use route context `user` and policy-gated server user client access where needed

### New post-authentication auth-flow page

1. Place route under `/(private)/(auth)/`
2. Authentication and providers are inherited from the `(private)` root
3. The card panel layout is inherited from the `(private)/(auth)` layout

### New public API endpoint

1. Place route under `/(public)/api/`
2. No React layout, server handlers only
3. Add `buildPublicApiCacheMiddleware()` to `server.middleware` so responses actually emit the public cache header
4. If this endpoint needs custom public TTLs, pass a custom profile to `buildPublicApiCacheMiddleware(profile)` (do not change route policy)

### New token-callback handler

1. Place route under `/(token-callbacks)/`
2. Keep the policy boundary at `/(token-callbacks)/auth`, not the token-callback root
3. Inherit `privateAnonymousBoundary` from that `auth` boundary route
4. Ensure server handlers set `private, no-store`

## Naming Conventions

Names should describe actual behavior:

- AuthCommandsProvider: command context only
- useAuthCommands: consumes command context
- AuthStateSync: global auth subscription and router/query sync
- Route policy module: policy types/constants/helpers
- Guards module: auth/profile guard logic
- Route boundaries module: shared route option composition

## Merge Checklist

1. Route class selected correctly
2. Cache header policy matches class
3. beforeLoad behavior matches class
4. Public SSR document path does not depend on user identity
5. Client auth command scope is explicit and minimal on public pages
6. Exactly one auth subscription exists at app level
7. Server user client access is only via policy-gated context path
8. Auth check failure handling follows redirect-aware guard rules
9. Descendant routes do not override route policy outside dedicated boundaries or use raw Cache-Control literals
