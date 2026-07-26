# Route Policy

## Route Classes

Choose a route class first. The class determines server auth behavior, cache policy, and how user capability is accessed.

| Class                | Typical routes                                            | Server user session       | Cache-Control                                               | Client auth commands         |
| -------------------- | --------------------------------------------------------- | ------------------------- | ----------------------------------------------------------- | ---------------------------- |
| Public content pages | /(public)/(pages) subtree                                 | Not used for SSR document | public, max-age=0, s-maxage=300, stale-while-revalidate=300 | Explicit client islands only |
| Auth-form pages      | /(public)/(auth) subtree                                  | Not used for SSR document | public, max-age=0, s-maxage=300, stale-while-revalidate=300 | Form islands                 |
| Private pages        | /(private)/(pages) subtree                                | Required                  | private, no-store                                           | Anywhere                     |
| Private auth forms   | /(private)/(auth) subtree (e.g. /auth/update-password)    | Required                  | private, no-store                                           | Anywhere                     |
| Public API           | /(public)/api subtree                                     | Not used                  | public (2xx/3xx only; errors are private, no-store)         | None                         |
| Token callbacks      | /(token-callbacks)/auth subtree (currently /auth/confirm) | Consumed (verifyOtp)      | private, no-store                                           | None                         |

Public documents and API responses also emit `Netlify-CDN-Cache-Control`
(with `durable`); see "Cache Policy vs Cache Profile".

## Route Tree Structure

```text
(public)/              ← policy root: public cache headers, no beforeLoad
  (pages)/             ← content pages: <main> layout, auth modal island,
                          useEnsureProfileExists (client-side check post-hydration)
  (auth)/              ← auth-form pages: card panel layout, useRedirectAuthenticatedUser
  api/                 ← public API endpoints (no React layout);
                          handlers apply shared public cache middleware directly

(private)/             ← policy root: requireAuthenticated beforeLoad ({ user } into
                          context), private Cache-Control
  (pages)/             ← content pages: <main> layout,
                          userHasProfile check (server-side, SSR gate)
  (auth)/              ← post-auth flow pages: card panel layout

(token-callbacks)/     ← source-only namespace; the policy boundary lives one level
                          down (see "Token-callback boundary placement" below)
  auth/                ← token-callback policy boundary: private Cache-Control
    confirm            ← leaf handler at /auth/confirm; parses query params and
                          sets private, no-store on every response/redirect path
```

Public content and auth-form pages remain cache-safe because SSR document output does not branch on user identity.
Authenticated users are redirected away from auth-form pages after hydration via `useRedirectAuthenticatedUser()`, keeping the documents cacheable while avoiding stale server-side cookie branching.

Profile completion is encouraged client-side: authenticated users without a profile are redirected after hydration via `useEnsureProfileExists()`, preserving cache safety while maintaining proactive guidance.

## User Supabase Capability

The user-scoped Supabase client is never part of router context. All access goes
through the isomorphic `createUserSupabaseClient()` factory
(`src/integrations/supabase/user.ts`):

- On the server it creates a per-request client from the request's auth cookies.
- On the client it returns a shared browser singleton (one GoTrue instance
  app-wide, so auth events propagate reliably between commands and
  `AuthStateSync`).
- React code uses the `useUserSupabaseClient()` hook
  (`src/integrations/supabase/user.hooks.ts`), which wraps the factory. There is
  no provider; route-tree position cannot change which client a component gets.

Because capability is not threaded through context, nothing about the route
tree can accidentally hand user capability to public SSR. What keeps public
routes honest is enforcement, layered below.

## Enforcement Layers (defense in depth)

1. **Boundaries (top-down intent).** Policy roots call boundary factories
   from `src/app/route-boundaries.ts` that return the complete route options,
   coupling cache headers with auth behavior (`publicBoundary()`,
   `authenticatedBoundary()`, `privateAnonymousBoundary()`). The
   policy-reserved keys (`headers`, `beforeLoad`) are typed `never` on the
   factory input and merged last, so overriding a subtree's policy at a
   boundary is a type error rather than a silent spread replacement. Default
   posture is private; public caching is an explicit opt-in at the `(public)`
   root.
2. **Lint (static).** Importing `@/integrations/supabase/user` or
   `@/integrations/supabase/user.hooks` inside `src/routes/(public)/**` is an
   ESLint error, as are raw cache-header string literals in route files.
3. **Session-read tripwire (runtime, bottom-up).** Any server-side creation of
   the user Supabase client marks the request via an AsyncLocalStorage
   sentinel (`src/server/lib/session-read-sentinel.ts`). The tripwire request
   middleware downgrades any session-reading response that is not already
   `private`/`no-store` — stripping CDN cache headers — and reports a policy
   violation to observability when the response had declared itself publicly
   cacheable. Boundaries declare intent; the tripwire verifies the render
   proved it.
4. **Error-response cache safety (runtime).** Boundary headers apply to a
   subtree regardless of response status, so 4xx/5xx documents are downgraded
   to `private, no-store` — an SSR failure on a public page must not be served
   from the CDN for the full public TTL after the problem recovers.
5. **Set-Cookie safety net (runtime).** Any HTML or redirect response that
   sets a Supabase auth cookie is forced to `private, no-store` regardless of
   route configuration.

Tripwire caveats:

- Middleware order in `src/start.ts` is load-bearing and pinned by
  `start.unit.test.ts`: the Sentry request middleware reads auth claims for
  telemetry on every request _before_ the tripwire establishes its tracked
  scope, so that observability-only read intentionally does not trip the wire.
- Headers are committed when body streaming starts: a session read inside a
  deferred/streamed segment cannot retro-downgrade the response. Keep server
  session reads out of deferred data on public routes.

## Boundary Rules

Each policy boundary route file declares:

- Cache header policy for the entire subtree (`headers`)
- Auth enforcement where applicable (`beforeLoad: requireAuthenticated`, which
  also places the serializable `{ user }` into context for the subtree)

Layout routes below each policy root add React-level concerns (HTML structure)
without changing the inherited policy.

Public API handlers are an exception: route-policy boundaries do not apply
document `headers` to `server.handlers` responses. Public API routes must set
their cache headers explicitly via shared server middleware
(`buildPublicApiCacheMiddleware`).

Token-callback handlers are a partial exception: they do inherit policy from the
`/(token-callbacks)/auth` boundary, but they must still parse request input and
enforce `private, no-store` directly in their handler response path.

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

Public responses emit two headers:

- `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=300` —
  the portable header. `s-maxage` stays here because CloudFront ignores
  `CDN-Cache-Control` variants entirely; any CDN can act on this header alone.
- `Netlify-CDN-Cache-Control: public, s-maxage=300, stale-while-revalidate=300, durable` —
  Netlify consumes and strips this at its edge (browsers and other CDNs never
  see it); `durable` opts into the durable cache tier.

Private responses are `private, no-store`, and every downgrade path also strips
CDN-directed cache headers.

Rules:

- Do not use raw cache-header string literals in route files (lint-enforced).
- Use `getPublicDocumentCacheHeaders(profile)` for boundary-level public headers
  and TTL tuning.
- Use `getPrivateDocumentCacheHeaders()` for boundary-level private headers.
- Use `buildPublicApiCacheMiddleware(profile)` for public API handlers. It marks
  2xx/3xx responses public and stamps 4xx/5xx (returned or thrown) as
  `private, no-store` so a cached error cannot outlive upstream recovery.
- Use `createPrivateNoStoreHeaders()` / `withPrivateNoStoreCacheControl()` when a
  server handler must enforce private no-store directly on its own responses.
- Server-side header rewrites go through `setResponseHeadersSafely()`
  (`src/server/lib/response-headers.ts`), which tolerates immutable-header
  responses and preserves multi-value `Set-Cookie`.

The default public profile is defined by `DEFAULT_PUBLIC_DOCUMENT_CACHE_PROFILE` in `src/lib/route-policy.ts`.

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

`useAuthCommands()` (`src/features/auth/hooks/use-auth-commands.ts`) is a
standalone hook exposing imperative auth actions. There is no provider; the
hook builds commands lazily against the browser client singleton at call time,
so rendering it is SSR-safe anywhere.

Command surface:

- login
- register
- resetPassword
- resendRegisterConfirmation
- updatePassword
- logout

Logout behavior:

- On success: `router.invalidate()` is called directly at the call site, and
  `AuthStateSync` (`SIGNED_OUT`) also invalidates as the event-driven path
- On failure: show a toast (`Log out failed`) and log with `logErrorWithObservability`

## Auth State Sync

Auth state subscription is global and mounted once.

`AuthStateSync` must be mounted exactly once in provider scope where all required hooks are valid:

- query client context
- TanStack Router hooks

It uses the same browser user Supabase singleton as auth commands, so
same-client auth events propagate deterministically.

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
3. Islands use `useUserSupabaseClient()` / `useAuthCommands()` directly

Typical examples:

- Header user status/menu island
- Auth modal controller island
- Favorite interactions that become user-aware post-hydration

## Adding New Routes

### New public content page

1. Place route under `/(public)/(pages)/`
2. Use `publicSupabaseClient` from router context for any data loading (no user session)
3. For user-specific UI, use `ClientOnly` islands post-hydration
4. Never read the user session server-side here — lint blocks the imports, and
   the tripwire will downgrade (and report) the response if it happens anyway

### New auth-form page (public, anonymous)

1. Place route under `/(public)/(auth)/`
2. Keep SSR output user-agnostic so the page remains publicly cacheable
3. Use `useRedirectAuthenticatedUser(next)` to redirect logged-in users after hydration when needed
4. Access auth commands via `useAuthCommands()`

### New private content page

1. Place route under `/(private)/(pages)/`
2. Authentication is inherited; `user` is available in route context
3. Loaders and components access the user client via `createUserSupabaseClient()` /
   `useUserSupabaseClient()`

### New post-authentication auth-flow page

1. Place route under `/(private)/(auth)/`
2. Authentication is inherited from the `(private)` root
3. The card panel layout is inherited from the `(private)/(auth)` layout

### New public API endpoint

1. Place route under `/(public)/api/`
2. No React layout, server handlers only
3. Add `buildPublicApiCacheMiddleware()` to `server.middleware` so responses actually emit the public cache headers
4. If this endpoint needs custom public TTLs, pass a custom profile to `buildPublicApiCacheMiddleware(profile)` (do not change route policy)

### New token-callback handler

1. Place route under `/(token-callbacks)/`
2. Keep the policy boundary at `/(token-callbacks)/auth`, not the token-callback root
3. Inherit the `privateAnonymousBoundary()` policy from that `auth` boundary route
4. Ensure server handlers set `private, no-store` on every response and redirect path

## Naming Conventions

Names should describe actual behavior:

- useAuthCommands: standalone auth command hook (no provider)
- useUserSupabaseClient: user client access for React code (no provider)
- AuthStateSync: global auth subscription and router/query sync
- Route policy module: cache profile constants and header helpers
- Guards module: auth/profile guard logic
- Route boundaries module: shared route option composition
- Session-read sentinel: per-request session-read tracking for the tripwire

## Merge Checklist

1. Route class selected correctly
2. Cache header policy matches class
3. beforeLoad behavior matches class
4. Public SSR document path does not depend on user identity
5. No server session reads on public routes (lint passes; no tripwire
   violations logged when exercising the page)
6. Exactly one auth subscription exists at app level
7. No deferred/streamed server session reads on public routes (the tripwire
   cannot retro-downgrade committed headers)
8. Auth check failure handling follows redirect-aware guard rules
9. Descendant routes do not set raw cache-header literals or re-declare policy
   outside dedicated boundaries
