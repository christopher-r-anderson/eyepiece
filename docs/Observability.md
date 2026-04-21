# Observability

Eyepiece uses Sentry for client-side and server-side observability.

This document covers the current setup, the main integration points, and the development patterns that keep reporting consistent.

## What Is Tracked

- Client exceptions captured from route and catch boundaries.
- Server request and server-function failures.
- Browser tracing and Replay when Sentry is enabled.
- Authenticated user id on both client and server events.
- Structured tags and context attached to application errors when the error carries observability metadata.

Expected user-facing errors such as handled form errors, validation failures, redirects, not-found responses, and other 4xx responses are intentionally treated as low-noise and normally stay out of Sentry.

## Runtime Setup

### Shared Config

`src/integrations/sentry/config.ts` normalizes the Sentry runtime config for both sides of the app.

- Client config reads `VITE_SENTRY_*` variables.
- Server config prefers `SENTRY_*` runtime variables and falls back to the matching `VITE_SENTRY_*` values.
- Both client and server keep Sentry disabled in test mode.
- Sample-rate values are parsed and clamped through the shared helper.

Environment variable details stay in [EnvironmentVariables.md](EnvironmentVariables.md).

### Client Setup

Client Sentry is initialized in `src/router.tsx` through `initClientSentry` from `src/integrations/sentry/client.ts`.

The client integration enables:

- TanStack Router browser tracing.
- Replay.
- Environment, release, and sampling from the normalized client config.

### Server Setup

Server Sentry is initialized in `src/server.ts` through `initServerSentry` from `src/integrations/sentry/server.ts`.

The server entry also wraps the request handler with `wrapFetchWithSentry`, and `src/start.ts` registers the shared Sentry request and server-function middleware.

That means server observability covers both full requests and TanStack Start server functions through the existing app entry points.

### Build Integration

The Sentry Vite plugin is configured in `vite.config.ts`.

It is responsible for source map upload during builds and is skipped in Vitest runs.

## Error Capture and Reporting Rules

The shared reporting rules live in `src/lib/error-observability.ts`.

This module decides whether an error is expected or operational and whether it should be reported.

In practice:

- Redirects, not-found results, handled validation errors, and other 4xx responses are treated as expected.
- Unexpected exceptions and server failures are treated as operational and are reported.
- `ResultError` values can carry explicit observability settings, tags, and context.

When an error already carries observability metadata, the server `beforeSend` hook merges that metadata into the Sentry event.

## Route and Boundary Capture

The shared UI capture helpers live in `src/app/layout/route-error.tsx`.

Use these helpers for route-level and catch-boundary error UI:

- `RouteError`
- `CapturedPrettyError`
- `CapturedAlertError`

These helpers keep two things consistent:

- They only report errors that pass the shared `shouldReportError` rules.
- They attach route-oriented metadata such as boundary kind, feature, operation, provider id, and route path.

If you add a new route boundary or local catch boundary and want it reported, use these helpers instead of calling `Sentry.captureException` directly from the component.

## Authenticated User Context

Sentry user context is kept in sync with Supabase auth on both sides of the app.

### Client

Client user syncing is handled in:

- `src/features/auth/auth.provider.tsx`
- `src/features/auth/auth.queries.ts`
- `src/features/auth/auth.sentry.ts`

The auth provider applies the bootstrap user and later auth events to Sentry, and the auth query path also updates Sentry when current-user data is fetched.

### Server

Server user syncing is handled in `src/integrations/sentry/server.ts`.

For each request, the request middleware reads verified auth claims from the server Supabase client and sets the Sentry user id inside the request isolation scope.

If the lookup fails, request handling continues and Sentry user context is cleared for that request.

## Local Verification

Use `/dev/observability` to verify the current behavior locally.

The workbench covers four scenarios:

- Client render error captured from a catch boundary.
- Handled UI form error that stays visible and unreported.
- Server-thrown route reached through a full document request.
- Handled 400 route response that renders but stays unreported.

When testing locally with auth enabled, also confirm that both client and server events include the authenticated user id.

## Development Notes

When changing error handling or adding new boundaries, keep these rules in mind:

- Reuse the shared route-error helpers so route metadata and report filtering stay consistent.
- Keep expected user-facing failures as handled errors instead of reporting them as generic exceptions.
- If an application error needs extra observability detail, attach tags or context through the `observability` field on the `ResultError` shape.
- Keep new server entry points inside the existing Sentry-wrapped request and middleware flow so server events continue to be captured.
