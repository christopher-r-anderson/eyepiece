# Eyepiece - NASA Media Site

## Project Setup

### Local Development

#### Setup

This is the guide for setting up local development for eyepiece.net. If you want to deploy this code to your own site, please see New Production Site below, first.

```bash
pnpm install
cp .env.example .env.local
```

Edit your `.env.local` file to replace the placeholders with the real values. See comments in the file for reference.

#### Running Locally

```bash
pnpm dev
```

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
2. Note the project name you gave it which will be used in the Supabase setup process. This can always be found under `Project Configuration -> General -> Project information -> Project name`
3. Domain - do one of the following. Which one you choose will be the one used in the next section with the Supabase URL Configuration for Authentication
  a. Just use your Netlify subdomain for your website `Domain Management -> Production domains -> Netlify subdomain`
  b. Set up a primary domain by following [Netlify Docs: Get started with domains](https://docs.netlify.com/manage/domains/get-started-with-domains/) which you can then always find under `Domain Management -> Production domains -> Primary domain`.

#### Supabase

Supabase is used for authentication, so you will need a project set up in Supabase.

1. Make sure row level security (RLS) is enabled.
2. Obtain your project id from the Supabase dashboard: `Project Settings -> General -> Project ID`
3. Create a publishable key for connecting to Supabase (this is safe for use on the client): `Project Settings -> API Keys -> Publishable key`
4. Authentication - this has only been developed to handle the following as enabled:
  a. `Authentication -> Sign In / Providers -> Supabase Auth`
    i. `User Signups -> Allow new users to sign up`
    ii. `User Signups -> Confirm Email`
  b. `Auth Providers -> Email`
    i. `Enable Email Provider`
    ii. *Email change is unimplemented*
    iii. `Minimum password length` = 12 (This is currently hardcoded into `PASSWORD_MIN_LENGTH` at `/src/features/auth/forms/components/set-password-field.schema.ts`)
  c. `URL Configuration`
    i. `Site URL` - this should be set to your public production domain origin, e.g. `https://eyepiece.net` or your Netlify subdomain if you aren't using a custom one.
    ii. `Redirect URLs` (You can tighten up most of these if desired, but do not loosen up production)
      - `https://**--eyepiece.netlify.app/**` - replace `eyepiece` with your Netlify project's name from the previous Netlify section. It also matches your netlify subdomain but prefixed with more characters in the subdomain.
      - `http://localhost:3000/**` - for development
      - `https://eypiece.net/auth/confirm` - the origin should follow your setting under Site URL postfixed with `/auth/confirm`
  d. `Email -> Templates` - TODO - this will be moved into code, so documenting this then
  e. `Email -> SMTP Settings` - TODO
5. Proceed with the local development setup.
