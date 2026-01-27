# Eyepiece - NASA Media Site

## Project Setup

### Local Development

#### Setup

This is the guide for setting up local development for eyepiece.net. If you want to deploy this code to your own site, please see New Production Site below, first.

```bash
pnpm supabase start # note "Project URL" and "Authentication Keys -> Publishable"
cp .env.example .env.local # Update your `.env.local` file with the values from above
pnpm install
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

Note that you can use `pnpm fix` instead of `pnpm lint` and `pnpm format` to run them both and autofix any issues found (when possible).

### New Production Site

You need to set up the following prerequisites if you are going to use this code in your own project outside of the Eyepiece website.

If you are just developing for eyepiece.net, this is already set up.

#### Netlify

1. Create a project
1. Note the project name you gave it which will be used in the Supabase setup process. This can always be found under `Project Configuration -> General -> Project information -> Project name`
1. Domain - do one of the following. Which one you choose will be the one used in the next section with the Supabase URL Configuration for Authentication
   1. Just use your Netlify subdomain for your website `Domain Management -> Production domains -> Netlify subdomain`
   1. Set up a primary domain by following [Netlify Docs: Get started with domains](https://docs.netlify.com/manage/domains/get-started-with-domains/) which you can then always find under `Domain Management -> Production domains -> Primary domain`.

#### Supabase

Supabase is used for authentication, so you will need a account and project.

Only do this for a freshly created account where you do not want to save anything. _The following actions will overwrite your account database and settings_

Note that the current authentication setup uses email as the provider, allows new sign ups, and requires email confirmation. These are the only flows supported and it is out of scope of the current project to handle other setups.

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
1. Proceed with the local development setup.
