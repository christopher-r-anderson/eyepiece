# Database access and migrations

Supabase [stops automatically exposing new public tables on October 30, 2026](https://github.com/orgs/supabase/discussions/45329).
Existing table grants survive. Grants decide whether a role can access a table;
RLS decides which rows it can access. Eyepiece needs both.

`20261022155134_explicit_data_api_grants.sql` normalizes the five application
tables to the following privileges. Existing RLS policies are unchanged.

| Table                     | `anon` | `authenticated`                | `service_role`                 |
| ------------------------- | ------ | ------------------------------ | ------------------------------ |
| `profiles`                | SELECT | SELECT, INSERT, UPDATE         | SELECT, INSERT, UPDATE, DELETE |
| `favorites`               | None   | SELECT, INSERT, DELETE         | SELECT, INSERT, UPDATE, DELETE |
| `asset_preview_snapshots` | SELECT | SELECT                         | SELECT, INSERT, UPDATE, DELETE |
| `collections`             | SELECT | SELECT, INSERT, UPDATE, DELETE | SELECT, INSERT, UPDATE, DELETE |
| `collection_items`        | SELECT | SELECT, INSERT, DELETE         | SELECT, INSERT, UPDATE, DELETE |

Profiles and snapshots are public reads. Favorites are owner-only. Collections
and their items are visible to the owner or when the collection is public; only
the owner can mutate them. Profile deletion is admin/auth-user cleanup, not a
client operation. Favorites and collection items have no update policy.
Service access supports snapshot revalidation, showcase provisioning and admin
cleanup; BYPASSRLS does not replace table grants. No API role needs TRUNCATE,
REFERENCES, TRIGGER or MAINTAIN.

The migration removes the historical `postgres` default grants on public tables
and sequences, including service-role defaults. It does not change defaults for
Supabase-managed owners or schemas. Application migrations run as `postgres`;
objects created by another owner need their own explicit ACL review. Existing
function ACLs/defaults are unchanged: the snapshot ensure, stale-selection and
orphan-sweep RPCs explicitly revoke execution from PUBLIC, anon and authenticated
and grant it only to service_role. Preserve that boundary.

## New migrations

- Create a forward migration with `pnpm supabase migration new <name>`; do not
  rewrite applied migrations to fix permissions.
- Enable RLS and define the intended policies for every exposed table. Grant only
  the required operations to each API role in the same migration. Include
  service_role explicitly when server code needs direct table access.
- UUID keys need no sequence grants. For identity/serial keys, grant only the
  sequence privileges the intended callers require.
- Review every new function's EXECUTE grants. PostgreSQL grants EXECUTE to PUBLIC
  by default and the historical schema also grants it directly to API roles.
  A service-only RPC must revoke from all three client principals, not just
  PUBLIC. Keep SECURITY DEFINER functions' search paths fixed and audit their
  authorization separately from table RLS.
- Extend `supabase/tests/data_api_grants.test.sql` when the access contract
  changes, and exercise the operation through the application integration suite.

Do not restore broad default privileges or enable `auto_expose_new_tables` to
make a missing grant disappear. The local CLI is locked at 2.116.0 while the
production publish job uses 2.72.8; this fix uses SQL compatible with both and
does not require a CLI/config upgrade.

## Local verification

`pnpm supabase test db` runs transaction-scoped pgTAP tests against the running
local database, also in the existing CI integration job. They assert the exact
privilege matrix, future table/sequence defaults, RLS behavior for anonymous,
owner and non-owner callers, and service-only snapshot RPCs.

For a disposable local database, with Docker, `psql` and Supabase running:

```sh
pnpm test:db-replay --reset-local
pnpm test:integration
```

**The replay script deletes all local database data, including auth users.** It
checks the CLI's database and API URLs are loopback addresses and only uses
`--local`; it never uses linked/hosted targets. Run it from the repository root.
It first resets and tests ordinary migration history. It then resets only to the
initial remote-schema migration, revokes that migration's automatic table and
sequence defaults before any application tables are created, applies the rest,
restores the local user seed, and tests again. This prevents the historical
`GRANT ALL` defaults from hiding missing explicit grants. It leaves the local
server running with all migrations and the seed applied.

Generate ignored `.env.test`/`.env.local` values from this same local server
before running application tests; never point test credentials at production.
