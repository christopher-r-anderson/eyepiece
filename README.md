# Eyepiece - NASA Media Site

## Project Setup

### Local Development

#### Setup

This is the guide for setting up local development for eyepiece.net. If you want to deploy this code to your own site, please see New Production Site below, first.

```bash
pnpm supabase start # note "Project URL" and "Authentication Keys -> Publishable"
pnpm install

# You can do one of the following to set up your environment variables
# on a system with bash (Linux, WSL _untested_, etc.)
pnpm create-env-local
# OR
cp .env.example .env.local # snd update your `.env.local` file with the values from `pnpm supabase start` above

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

- `pnpm lint` (runs `eslint`)
- `pnpm format` (runs `prettier`)
- `pnpm typecheck` (runs `tsc`)
- `pnpm test` (runs `vitest`)
- `pnpm e2e` (runs `playwright test`)

You can use `pnpm fix` instead of `pnpm lint` and `pnpm format` to run them both and autofix any issues found (when possible).

E2E tests may generate a `deno.lock` file the first time because the `netlify` cli is used to serve the project. This file can be safely deleted since the project does not use edge functions. If they are used in the future, remove the entry from `.gitignore` and track the file.

### New Production Site

You need to set up the following prerequisites if you are going to use this code in your own project outside of the Eyepiece website.

If you are just developing for eyepiece.net, this is already set up.

GitHub repo hosting and Netlify web hosting are required for these instructions. You will have to adjust CI/CD strategies if using other environments.

#### GitHub - Part One

1. Clone the project to your repo

#### Netlify - Part One

Note that `deno.lock` is ignored in the `.gitignore` file because edge functions are not used. If you do use them, you will need to remove that entry.

1. Create a project and connect it to your GitHub repo - install the GitHub integration app for automatic builds, deploys, and previews here.
1. Note the project name you gave it which will be used in GitHub and in the Supabase setup process. This can always be found under `Project Configuration -> General -> Project information -> Project name`
1. Lock production auto-publishing - `Deploys -> Lock production auto-publishing`. Netlify production builds will be published by CI after checks and tests have successfully run.
1. Note the Project ID that was generated and shown under `Project Configuration -> General -> Project information -> Project ID` which will be used in GitHub (as `NETLIFY_SITE_ID`).
1. Generate a Personal Access Token under `User settings -> Applications -> Personal access tokens` which will be used in GitHub (as `NETLIFY_AUTH_TOKEN`) for publishing production builds. It is recommended to use an expiration date and set a reminder wherever you manage project related events and requirements to update this before expiration. _Updating auth tokens is not automated and will result in builds failing to make it to production._
1. Domain - do one of the following. Which one you choose will be the one used in the next section with the Supabase URL Configuration for Authentication
   1. Just use your Netlify subdomain for your website `Domain Management -> Production domains -> Netlify subdomain`
   1. Set up a primary domain by following [Netlify Docs: Get started with domains](https://docs.netlify.com/manage/domains/get-started-with-domains/) which you can then always find under `Domain Management -> Production domains -> Primary domain`.

#### GitHub - Part Two

Within your project in GitHub, Go to `Settings -> Secrets and variables -> Actions`. Here we will provide the CI workflow with the needed environment variables for publishing the production builds.

On this panel, you have options between

1. `Secrets` and `Variables` - described below
1. `Environment` vs `Repository` - `Repository` is fine for both variables and what is used below. You can use an environment if you set one up, but that is outside of the scope of this document.

Add the following two items:

- `Secrets -> Repository secrets -> New repository secret`
  - Name: `NETLIFY_AUTH_TOKEN`
  - Value: The Personal Access Token that you created in the previous Netlify section. _This is sensitive data and must be created as a secret._
- `Variables -> Repository variables -> New repository variable`
  - Name: `NETLIFY_SITE_ID`
  - Value: The Project ID noted in the previous Netlify section. You may create this as a secret if you want to keep it alongside your auth token in the ui, but it is not sensitive and by doing that you will not be able to see the value later. If you do create it as a secret instead of a variable, you _must_ change the line in `.github/workflows/ci.yml` from `NETLIFY_SITE_ID: ${{ vars.NETLIFY_SITE_ID }}` to `NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}`

#### Supabase

Supabase is used for authentication, so you will need a account and project.

Only do this for a freshly created account where you do not want to save anything. _The following actions will overwrite your account database and settings_

Note that the current authentication setup uses email as the provider, allows new sign ups, and requires email confirmation. These are the only flows supported and it is out of scope of the current project to handle other setups.

1. In the web admin panel for your project, note the URL under `Settings -> Data API -> Project URL`. This will be used in Netlify as `VITE_SUPABASE_URL`.
1. Also note you Publishable key. This is found under `Settings -> API Keys -> Publishable key`. You should already have one there with the name of `default`. You need the value of this (column `API KEY`) which you will use later in Netlify as `VITE_SUPABASE_PUBLISHABLE_KEY`. If you no longer have a key available, you can generate a new one with `New publishable key` - the name is not significant.
1. `pnpm supabase login` (if not already logged in via the cli)
1. `pnpm supabase link` - select your newly created project (_the project selected here will be overwritten_)
1. Update your `supabase/config.toml` file to represent your new project:
   - `project_id` - set to your Project ID found in the Supabase Admin at `Project Settings -> General -> Project ID`
   - `[auth]`
     - `site_url` - this should be set to your public production domain origin, e.g. `https://eyepiece.net` or your Netlify subdomain such as `https://eyepiece.netlify.app/` if you aren't using a custom one.
     - `additional_redirect_urls` - modify these so that the domains match your project. You can be more specific with the paths if desired, but do not loosen up production.
       - `https://**--eyepiece.netlify.app/**` - replace `eyepiece` with your Netlify project's name from the previous Netlify section. It also matches your netlify subdomain but prefixed with more characters in the subdomain.
       - `http://localhost:3000/**` - for development - this will remain the same.
       - `https://eypiece.net/auth/confirm` - the origin should follow your setting under Site URL postfixed with `/auth/confirm`
   - `[auth.email.template.confirmation]` - update `subject` as desired
   - `[auth.email.template.recovery]` - update `subject` as desired
1. Authentication email templates under `supabase/templates/` - you can adjust the content of these as desired, but be careful not to change the URLs in the links as they specifically match what is required by the project.
1. `Email -> SMTP Settings` - TODO
1. `pnpm supabase db push`
1. `pnpm supabase config push`

#### Netlify - Part Two

Environment variables need to be added to Netlify so that it can supply the application with Supabase related values during build.

Under `Project Configuration -> Environment variables` add two items using `Add a single variable`. These are currently the same for all envs. You can adjust this if you have a more sophisticated Supabase environment setup.

- `VITE_SUPABASE_PUBLISHABLE_KEY` - This is the key you copied in the Netlify section under `Settings -> API Keys -> Publishable key`
- `VITE_SUPABASE_URL` - This is your URL from the Netlify settings under `Settings -> Data API -> Project URL`

#### Local setup

New project setup is complete. You can now move on to the previous local development setup section.
