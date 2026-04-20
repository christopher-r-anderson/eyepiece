# Environment Variables

This document currently covers the environment variable setup, broken down by topic / service.

## Sentry

This project uses separate variable prefixes for client build configuration and server runtime configuration.

- `VITE_SENTRY_*` variables are used by the client build. Vite embeds them into the browser bundle at build time.
- `SENTRY_*` variables are used by the server runtime. In the current deployment model, this means the Netlify server function at runtime.
- `SENTRY_AUTH_TOKEN` is build-only. It is used to upload source maps during `pnpm build` and is never needed at runtime.

The DSN is not a secret. The auth token is a secret.

On the server, this project prefers the `SENTRY_*` runtime variables and falls back to the matching `VITE_SENTRY_*` values when the runtime variables are not set.

### Variable Reference

#### Build Secret for Source Map Upload

- `SENTRY_AUTH_TOKEN`: used for build-time source map upload; set in Netlify build env and optionally local `.env.local`. Required wherever `pnpm build` should upload source maps to Sentry. Not needed for tests or runtime.

#### Client Build

- `VITE_SENTRY_ENABLED`: used by the client build and as a server fallback; set in `.env.local`, `.env.test`, and Netlify. Enables client-side Sentry. Use `false` locally and in tests unless intentionally verifying Sentry.
- `VITE_SENTRY_DSN`: used by the client build and as a server fallback; set in `.env.local`, `.env.test`, and Netlify. Public DSN used by the browser bundle.
- `VITE_SENTRY_ENVIRONMENT`: used by the client build and as a server fallback; set in `.env.local`, `.env.test`, and Netlify. Typical values are `local`, `test`, `preview`, or `production`.
- `VITE_SENTRY_RELEASE`: used by the client build and as a server fallback; optional. Optional explicit release identifier for the browser SDK. If this is unset, the Sentry build plugin will normally inject an auto-detected release during production builds, typically from CI commit metadata or the current git SHA.
- `VITE_SENTRY_TRACES_SAMPLE_RATE`: used by the client build and as a server fallback; optional. Transaction sampling rate for the browser SDK.
- `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`: used by the client build; optional. Browser Replay session sample rate. Not used by the server.
- `VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`: used by the client build; optional. Browser Replay on-error sample rate. Not used by the server.

#### Server Runtime

- `SENTRY_ENABLED`: used by server runtime; set in Netlify. Recommended for production even when `VITE_SENTRY_ENABLED` is also set. Keeps server runtime config explicit.
- `SENTRY_DSN`: used by server runtime; set in Netlify. Recommended runtime DSN for the Netlify server function. Usually the same value as `VITE_SENTRY_DSN`.
- `SENTRY_ENVIRONMENT`: used by server runtime; set in Netlify. Recommended runtime environment for server events. Usually the same value as `VITE_SENTRY_ENVIRONMENT`.
- `SENTRY_RELEASE`: used by server runtime; optional. Optional explicit server release identifier. If this is unset, the server falls back to `VITE_SENTRY_RELEASE`; if both are unset, the Sentry build plugin will normally inject an auto-detected release during production builds, typically from CI commit metadata or the current git SHA.
- `SENTRY_TRACES_SAMPLE_RATE`: used by server runtime; optional. Recommended if you want the server trace sample rate to be explicit instead of relying on the `VITE_` fallback.

### Local Development

Local development should normally leave Sentry disabled.

- Keep `VITE_SENTRY_ENABLED=false` in `.env.local` unless you are intentionally verifying the Sentry integration.
- If Sentry is disabled, the rest of the Sentry vars can be left blank.
- Local development usually does not need separate `SENTRY_*` runtime vars because the server falls back to the `VITE_SENTRY_*` values.
- `SENTRY_AUTH_TOKEN` is only needed locally if you want a local `pnpm build` to upload source maps which is normally handled by the Netlify build server.

When you do want to verify observability locally, set `VITE_SENTRY_ENABLED=true`, provide a valid `VITE_SENTRY_DSN`, and use the dev-only workbench at `/dev/observability` to exercise the supported scenarios.

#### Local Observability Checklist

Use `/dev/observability` to confirm the current intended behavior:

1. Client render error: should be reported with route and boundary metadata.
2. Handled UI boundary error: should remain visible in the form and stay low-noise.
3. Server thrown error: should be triggered via the full-reload control and reported by the existing server request and function middleware.
4. Handled 400 response: should render in the boundary UI and should not be reported.
5. Signed-in local session: client-side events should be associated with the user id only.

Current limitations: request-scoped server-side user attachment is still deferred, and this local check does not currently prove route-boundary metadata on server-side events.

### Tests

Tests should leave Sentry disabled.

- Keep `VITE_SENTRY_ENABLED=false` in `.env.test`.
- The rest of the Sentry vars can be blank.
- `SENTRY_AUTH_TOKEN` is not needed for tests.
- The current Vitest setup skips the Sentry Vite plugin, so test runs do not require build-time Sentry credentials.

### GitHub Actions

The current GitHub Actions workflow does not build the production site.

- Lint, typecheck, unit tests, integration tests, and e2e do not need Sentry variables.
- The current publish job promotes a deploy that Netlify already built.
- Because Netlify performs the production build, `SENTRY_AUTH_TOKEN` does not need to be stored in GitHub Actions for the current workflow.

### Netlify

Netlify performs the production build and also runs the deployed server function.

For the current deployment model, Netlify should own the production Sentry configuration.

#### Recommended Client Build Variables

- `VITE_SENTRY_ENABLED=true`
- `VITE_SENTRY_DSN=...`
- `VITE_SENTRY_ENVIRONMENT=production`
- `VITE_SENTRY_RELEASE=...` optional. In production builds, leaving this unset normally lets the Sentry build plugin inject an auto-detected release from CI commit metadata or the current git SHA.
- `VITE_SENTRY_TRACES_SAMPLE_RATE=...`
- `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=...`
- `VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=...`

#### Recommended Server Runtime Variables

- `SENTRY_ENABLED=true`
- `SENTRY_DSN=...`
- `SENTRY_ENVIRONMENT=production`
- `SENTRY_RELEASE=...` optional. If this is unset, the server falls back to `VITE_SENTRY_RELEASE`; if both are unset, the Sentry build plugin will normally inject an auto-detected release during production builds.
- `SENTRY_TRACES_SAMPLE_RATE=...`

#### Recommended Build Secret (for source map uploads)

- `SENTRY_AUTH_TOKEN=...`

For source map uploads and default runtime release injection during production builds, the Sentry build plugin can auto-detect a release from `SENTRY_RELEASE`, CI commit variables, or the current git SHA. In practice, leaving both `SENTRY_RELEASE` and `VITE_SENTRY_RELEASE` blank will usually still produce a release value in Sentry for production builds.

Using both `VITE_SENTRY_*` and `SENTRY_*` in Netlify is recommended for production. The values often match, but they serve different purposes:

- `VITE_SENTRY_*` configures the browser bundle at build time.
- `SENTRY_*` keeps the server runtime configuration explicit.

The replay sample-rate settings are client-only and do not need `SENTRY_*` runtime equivalents.
