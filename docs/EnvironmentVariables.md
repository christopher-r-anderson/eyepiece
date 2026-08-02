# Environment Variables

Reference for every environment variable the project uses: the table shows where each value lives, and the sections after it explain the ones with real semantics. [NewProductionSite.md](NewProductionSite.md) walks through obtaining the values in setup order.

## What Goes Where

| Variable                                   | GitHub Actions | Netlify  | `.env.local` |
| ------------------------------------------ | -------------- | -------- | ------------ |
| `SI_OA_API_KEY`                            | secret         | secret   | yes          |
| `NETLIFY_AUTH_TOKEN`                       | secret         |          |              |
| `NETLIFY_SITE_ID`                          | variable       |          |              |
| `SUPABASE_ACCESS_TOKEN`                    | secret         |          |              |
| `SUPABASE_DB_PASSWORD`                     | secret         |          |              |
| `SUPABASE_PROJECT_REF`                     | variable       |          |              |
| `SUPABASE_SECRET_KEY`                      | secret         | secret   | yes          |
| `SHOWCASE_USER_EMAIL`                      | secret         |          | yes          |
| `VITE_SUPABASE_URL`                        | derived        | yes      | yes          |
| `VITE_SUPABASE_PUBLISHABLE_KEY`            | variable       | yes      | yes          |
| `VITE_SENTRY_ENABLED`                      | variable       | yes      | yes          |
| `VITE_SENTRY_DSN`                          | variable       | yes      | optional     |
| `VITE_SENTRY_ENVIRONMENT`                  | variable       | yes      | optional     |
| `VITE_SENTRY_RELEASE`                      | optional       | optional |              |
| `VITE_SENTRY_TRACES_SAMPLE_RATE`           | optional       | optional | optional     |
| `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`  | optional       | optional | optional     |
| `VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` | optional       | optional | optional     |
| `SENTRY_ENABLED`                           |                | yes      |              |
| `SENTRY_DSN`                               |                | yes      |              |
| `SENTRY_ENVIRONMENT`                       |                | yes      |              |
| `SENTRY_RELEASE`                           |                | optional |              |
| `SENTRY_TRACES_SAMPLE_RATE`                |                | optional |              |
| `SENTRY_AUTH_TOKEN`                        | secret         | secret   | optional     |
| `AWS_LAMBDA_JS_RUNTIME`                    |                | yes      |              |
| `NODE_VERSION`                             |                | toml     |              |

Reading the table:

- GitHub Actions cells say whether the value is a repository secret or a repository variable. Every Sentry row applies only if you use Sentry.
- `VITE_SUPABASE_URL` is derived in GitHub: the publish workflow builds it from `SUPABASE_PROJECT_REF`.
- `.env.test` is generated (`pnpm -s print-supabase-env > .env.test`) and keeps `VITE_SENTRY_ENABLED=false`; nothing in it is provisioned by hand.
- `NODE_VERSION` lives in `netlify.toml`; the Netlify UI Node version setting is kept matching it.
- `PRERENDER` and `PROVIDER_FIXTURE_MODE` are workflow and script flags, set where they are used and never provisioned.

## Sentry

This project uses separate variable prefixes for client build configuration and server runtime configuration.

- `VITE_SENTRY_*` variables are used by the client build. Vite embeds them into the browser bundle at build time.
- `SENTRY_*` variables are used by the server runtime. In the current deployment model, this means the Netlify server function at runtime.
- `SENTRY_AUTH_TOKEN` is build-only. It is used to upload source maps during `pnpm build` and is never needed at runtime.

The DSN is not a secret. The auth token is a secret.

On the server, this project prefers the `SENTRY_*` runtime variables and falls back to the matching `VITE_SENTRY_*` values when the runtime variables are not set.

### Variable Reference

#### Build Secret for Source Map Upload

- `SENTRY_AUTH_TOKEN`: uploads source maps during `pnpm build`. Not needed for tests or runtime.

#### Client Build

- `VITE_SENTRY_ENABLED`: enables client-side Sentry. Keep it `false` locally and in tests unless intentionally verifying Sentry.
- `VITE_SENTRY_DSN`: public DSN used by the browser bundle.
- `VITE_SENTRY_ENVIRONMENT`: typical values are `local`, `test`, `preview`, or `production`.
- `VITE_SENTRY_RELEASE`: optional explicit release identifier for the browser SDK. Unset lets the Sentry build plugin auto-detect a release during production builds, typically from CI commit metadata or the current git SHA.
- `VITE_SENTRY_TRACES_SAMPLE_RATE`: transaction sampling rate for the browser SDK.
- `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`: browser Replay session sample rate. Not used by the server.
- `VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`: browser Replay on-error sample rate. Not used by the server.

#### Server Runtime

- `SENTRY_ENABLED`: recommended for production even when `VITE_SENTRY_ENABLED` is also set. Keeps server runtime config explicit.
- `SENTRY_DSN`: runtime DSN for the Netlify server function. Usually the same value as `VITE_SENTRY_DSN`.
- `SENTRY_ENVIRONMENT`: runtime environment for server events. Usually the same value as `VITE_SENTRY_ENVIRONMENT`.
- `SENTRY_RELEASE`: optional explicit server release identifier. Unset falls back to `VITE_SENTRY_RELEASE`; with both unset, the Sentry build plugin auto-detects a release during production builds.
- `SENTRY_TRACES_SAMPLE_RATE`: recommended if you want the server trace sample rate to be explicit instead of relying on the `VITE_` fallback.

### Local Development

Local development should normally leave Sentry disabled.

- Keep `VITE_SENTRY_ENABLED=false` in `.env.local` unless you are intentionally verifying the Sentry integration.
- If Sentry is disabled, the rest of the Sentry vars can be left blank.
- Local development usually does not need separate `SENTRY_*` runtime vars because the server falls back to the `VITE_SENTRY_*` values.
- `SENTRY_AUTH_TOKEN` is only needed locally if you want a local `pnpm build` to upload source maps, which is normally handled by the publish workflow.

When you do want to verify observability locally, set `VITE_SENTRY_ENABLED=true`, provide a valid `VITE_SENTRY_DSN`, and use the dev-only workbench at `/dev/observability` to exercise the supported scenarios.

#### Local Observability Checklist

Use `/dev/observability` to confirm the current intended behavior:

1. Client render error: should be reported with route and boundary metadata.
2. Handled UI boundary error: should remain visible in the form and stay low-noise.
3. Server thrown error: should be triggered via the full-reload control and reported by the existing server request and function middleware.
4. Handled 400 response: should render in the boundary UI and should not be reported.
5. Signed-in local session: client-side and server-side events should both be associated with the user id.

Current limitations: this local check does not currently prove route-boundary metadata on server-side events.

### Tests

Tests should leave Sentry disabled.

- Keep `VITE_SENTRY_ENABLED=false` in `.env.test`.
- The rest of the Sentry vars can be blank.
- `SENTRY_AUTH_TOKEN` is not needed for tests.
- The current Vitest setup skips the Sentry Vite plugin, so test runs do not require build-time Sentry credentials.

### Deployment Model

The publish workflow builds the production site in CI and uploads it with `netlify deploy`; Netlify builds deploy previews and branch deploys and runs the deployed server function for all of them.

- Client build values live in both stores: the Netlify copies serve preview and branch builds, the GitHub copies serve the production build. A client build value set beyond the code defaults needs both copies matching.
- The client sample rates pass through the publish workflow as optional repository variables; unset falls back to the code defaults.
- Release variables are optional and left unset in this deployment: the Sentry build plugin auto-detects a release from CI commit metadata or the current git SHA. An explicit `VITE_SENTRY_RELEASE` passes through the publish workflow like the sample rates and needs matching GitHub and Netlify copies; `SENTRY_RELEASE` is runtime-only and lives in Netlify.
- Server runtime values live only in Netlify; the function reads them at runtime no matter which builder produced the deploy.
- Only the publish job needs Sentry values; lint, typecheck, and the test jobs run without them.

## Providers

### `SI_OA_API_KEY`

Smithsonian Open Access API key, from https://api.data.gov/signup/. NASA's Image and Video Library needs no key.

Required in every deployed environment. The provider map is built when the module loads, so a missing key fails startup instead of surfacing on the first Smithsonian request. Keep it that way: a lazily-built adapter would turn a misconfigured deployment into an error a visitor finds.

The e2e suite is the one exception. With `PROVIDER_FIXTURE_MODE=replay` no request reaches the network, so the key is not required and CI does not supply one. Recording fixtures (`pnpm test:e2e:record`) does hit the live API and needs a real key.

## Showcase Provisioning

- `SHOWCASE_USER_EMAIL`: used by `pnpm provision-showcase`. The email address of the provisioned showcase account. Whoever controls this mailbox can access the showcase account through password reset, so it must be an address the deployment owner controls. Any placeholder address works locally.
