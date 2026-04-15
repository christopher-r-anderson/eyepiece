# New Production Site Setup

Use this guide if you want to deploy this codebase for your own project outside of the Eyepiece website.

If you are developing for `eyepiece.net`, this is already set up.

GitHub repo hosting and Netlify web hosting are assumed throughout. If you use other platforms, you will need to adapt the CI/CD and deployment steps.

## Asset Provider API Keys

### NASA Image and Video Library

NASA's Image and Video Library API does not require an API key.

### Smithsonian Institution Open Access

As documented at <https://edan.si.edu/openaccess/apidocs/>, you must obtain an API key from <https://api.data.gov/signup/>.

Once you have the key, add it to your local env files as part of local setup. You will also need it in the GitHub and Netlify configuration steps below.

## GitHub - Part One

1. Clone the project to your own repository.

## Netlify - Part One

Note that `deno.lock` is ignored in `.gitignore` because edge functions are not used. If you do use them, remove that ignore entry.

1. Create a Netlify project and connect it to your GitHub repository.
2. Note the project name under `Project Configuration -> General -> Project information -> Project name`. You will need it during Supabase setup.
3. Lock production auto-publishing under `Deploys -> Lock production auto-publishing`. Production publishing is intended to happen from CI after checks succeed.
4. Note the Project ID under `Project Configuration -> General -> Project information -> Project ID`. This is used in GitHub as `NETLIFY_SITE_ID`.
5. Generate a Personal Access Token under `User settings -> Applications -> Personal access tokens`. This is used in GitHub as `NETLIFY_AUTH_TOKEN` to publish production builds. Use an expiration date and keep track of it. If the token expires, production publishing will fail. If that failure happens alongside non-backwards-compatible database changes, the site can be left in a broken state.
6. Choose a production domain:
   - use the Netlify subdomain under `Domain Management -> Production domains -> Netlify subdomain`, or
   - configure a primary domain by following [Netlify Docs: Get started with domains](https://docs.netlify.com/manage/domains/get-started-with-domains/).

## Supabase

Supabase is used for authentication, so you will need a Supabase account and project.

Only follow these steps for a freshly created account or project where overwriting the database and settings is acceptable.

The current authentication implementation supports email auth, allows new sign-ups, and requires email confirmation. Other auth flows are out of scope for the current project.

1. Create your Supabase project and keep the database password available for the later GitHub setup.
2. Gather the following values for later steps:
   - Project URL: `Settings -> Data API -> Project URL`. Use this in Netlify as `VITE_SUPABASE_URL`.
   - Publishable key: `Settings -> API Keys -> Publishable key`. Use this in Netlify as `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - Secret key: `Settings -> API Keys -> Secret keys`. Use this in Netlify as `SUPABASE_SECRET_KEY`.
   - Project ID: `Project Settings -> General -> Project ID`.
   - Access token: `Account -> Account Preferences -> Access Tokens -> Generate new token`. Use this in GitHub as `SUPABASE_ACCESS_TOKEN`. Give it an expiration date and track it so it does not expire unexpectedly.
3. Run `pnpm supabase login` if you are not already logged in.
4. Run `pnpm supabase link` and select the new project. The linked project is the one that will be overwritten by later commands.
5. Update `supabase/config.toml` for your project:
   - Set `project_id` to your Supabase Project ID.
   - Under `[auth]`, set `site_url` to your public production origin, for example `https://example.com` or your Netlify subdomain.
   - Update `additional_redirect_urls` so they match your project domains:
     - `https://**--eyepiece.netlify.app/**`: replace `eyepiece` with your Netlify project name.
     - `http://localhost:3000/**`: keep this for local development.
     - `https://eypiece.net/auth/confirm`: replace the origin so it matches your configured site URL and ends with `/auth/confirm`.
   - Update `[auth.email.template.confirmation]` and `[auth.email.template.recovery]` subjects as desired.
6. Review the authentication email templates under `supabase/templates/`. You can adjust the content, but do not change the URLs in the links unless you also update the application flow to match.
7. Configure SMTP under `Email -> SMTP Settings`.
8. Run `pnpm supabase db push`.
9. Run `pnpm supabase config push`.

## GitHub - Part Two

In your GitHub repository, go to `Settings -> Secrets and variables -> Actions`.

You can use repository-level secrets and variables, or use an environment if you have one set up. Repository-level configuration is sufficient for the current setup.

Add the following four secrets under `Secrets -> Repository secrets -> New repository secret`:

- `SI_OA_API_KEY`: your Smithsonian Institution Open Access or `api.data.gov` API key.
- `NETLIFY_AUTH_TOKEN`: the Netlify Personal Access Token.
- `SUPABASE_ACCESS_TOKEN`: the Supabase access token.
- `SUPABASE_DB_PASSWORD`: the database password created during Supabase project setup. If you reset it later in Supabase, any other systems using that password will also need to be updated.

Add the following two repository variables under `Variables -> Repository variables -> New repository variable`:

- `NETLIFY_SITE_ID`: the Netlify Project ID.
- `SUPABASE_PROJECT_REF`: the Supabase Project ID.

You may choose to store these as secrets instead, but if you do, you must also update `.github/workflows/ci.yml` so those values are read from `secrets` instead of `vars`.

## Netlify - Part Two

Under `Project Configuration -> Environment variables`, add these variables:

- `SI_OA_API_KEY`: your Smithsonian Institution Open Access or `api.data.gov` API key.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the Supabase publishable key.
- `SUPABASE_SECRET_KEY`: the Supabase secret key.
- `VITE_SUPABASE_URL`: the Supabase Project URL.

The current setup uses the same values across environments. If you later introduce more sophisticated environment separation, you can adjust that in Netlify.

## Local Development After Setup

Once the new project setup is complete, return to the local development instructions in the main README.
