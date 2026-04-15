# Eyepiece - NASA Media Site

## Project Setup

### Local Development

#### Setup

This is the guide for setting up local development for eyepiece.net. If you want to deploy this code to your own site, see [docs/NewProductionSite.md](docs/NewProductionSite.md) first.

```bash
pnpm install
pnpm supabase start # note "Project URL" and "Authentication Keys -> Publishable"

# Set up your local env files by copying the examples and then updating them with your values.
cp .env.example .env.local
cp .env.test.example .env.test

# You can get your local supabase related values to use by running
pnpm print-supabase-env

# `SI_OA_API_KEY` is your Smithsonian Institute Open Access API Key from https://api.data.gov/signup/

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
