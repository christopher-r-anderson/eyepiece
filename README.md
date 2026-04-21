# Eyepiece - Space and Astronomy Image Portal

Eyepiece is a [multi-provider](./docs/Providers.md) image portal. It provides search and favoriting features for multiple open asset providers.

Visit the live site at <https://eyepiece.net>.

Issues to be completed before official launch are listed at [Launch Milestones](https://github.com/christopher-r-anderson/eyepiece/milestone/1).

## Project Setup

### Local Development

#### Setup

This is the guide for setting up local development for eyepiece.net. If you want to deploy this code to your own site, see [docs/NewProductionSite.md](docs/NewProductionSite.md) first.

```bash
pnpm install
pnpm supabase start # note "Project URL" and "Authentication Keys -> Publishable"

# Set up your local env files by copying the examples and then updating them with your values.
# `.env.local` is used for local app and build configuration.
# `.env.test` is used for test-mode runs like Vitest.
cp .env.example .env.local
cp .env.test.example .env.test

# You can get your local supabase related values to use by running
pnpm print-supabase-env

# `SI_OA_API_KEY` is your Smithsonian Institute Open Access API Key from https://api.data.gov/signup/

# Sentry env vars are optional for local development and tests.
# Leave `VITE_SENTRY_ENABLED=false` unless you are intentionally verifying the Sentry integration.
# See "Local Development" in `docs/EnvironmentVariables.md` for further details.

# To be able to run e2e tests, use one of the following:
# Note that this is over 400MB of downloads, though they will be shared with other local projects that use the same versions
pnpm playwright install
# If you are on Linux and do not already have playwright OS dependencies installed, use this instead
pnpm playwright install --with-deps
```

#### Running Locally

```bash
pnpm supabase start # if not already started
pnpm dev
```

### Observability

Eyepiece uses Sentry for client-side and server-side observability.

- Client-side observability is initialized from the router and includes route-aware tracing and Replay when enabled.
- Server-side observability is initialized from the server entry and captures request and server-function failures through shared middleware.
- Shared error observability rules keep expected errors, such as handled form errors and 400 responses, out of Sentry.
- When a user is signed in, both client and server events are associated with the authenticated user id.

For the main integration points and development guidance, see [docs/Observability.md](docs/Observability.md).

#### Local Observability Verification

To verify the Sentry integration locally:

1. Set `VITE_SENTRY_ENABLED=true` and provide a valid `VITE_SENTRY_DSN` in `.env.local`.
2. Start the app with `pnpm dev` and visit `/dev/observability`.
3. Confirm that the client render error reaches Sentry with route and boundary metadata.
4. Confirm that handled form errors remain visible in the UI but do not show up in Sentry.
5. Use the full-reload server-error control and confirm that the request is captured on the server.
6. Confirm that the handled 400 response renders in the boundary UI but does not show up in Sentry.
7. If you are signed in locally, confirm client-side and server-side events are associated with the authenticated user id.

#### Site authentication

There will be an existing user you can log in to the local site with:

- email: `user1@example.com`
- password: `hunter2`

#### Pre-commit Checklist

- `pnpm lint` runs `eslint`
- `pnpm format` runs `prettier`
- `pnpm typecheck` runs `tsc`
- `pnpm test:unit` runs `vitest --project unit`
- `pnpm test:integration` runs `vitest --project integration` (integration tests against local Supabase require `pnpm supabase start`)
- `pnpm test:e2e` runs `playwright test` (e2e tests against local Supabase require `pnpm supabase start`)

You can use `pnpm fix` instead of `pnpm lint` and `pnpm format` to run them both and autofix any issues found (when possible).

E2E tests may generate a `deno.lock` file the first time because the `netlify` cli is used to serve the project. This file can be safely deleted since the project does not use edge functions. If they are used in the future, remove the entry from `.gitignore` and track the file.

### New Production Site

If you would like to set up a new production site using this codebase or just wish to understand the setup, you can refer to the [New production site setup](docs/NewProductionSite.md) guide.

## Providers

Eyepiece supports multiple image asset providers.

### Current Providers

#### NASA Image and Video Library

- [NASA API portal](https://api.nasa.gov/) NASA Image and Video Library
- [NASA IVL API Documentation (PDF)](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf)
- Used with permission under the [NASA Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)

#### The Smithsonian Institution Open Access - National Air and Space Museum

- [The Smithsonian Institution Open Access API](https://edan.si.edu/openaccess/apidocs/)
- Used with permission under [The Smithsonian Institution Terms of Use](https://www.si.edu/termsofuse)

### Provider Integration

To understand the provider integration points or how to add a new provider, see the documentation in the [Providers Guide](./docs/Providers.md).
