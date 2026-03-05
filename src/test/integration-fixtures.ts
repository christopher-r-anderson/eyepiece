/**
 * Shared fixtures for integration tests.
 *
 * Provides a Vitest `it` extended with:
 *  - `user`   — a freshly-created Supabase test user, auto-deleted on teardown
 *  - `client` — a Supabase client signed in as that user
 *
 * Requires env vars (from .env.local / .env.test via vitest.integration.config.ts):
 *  - VITE_SUPABASE_URL
 *  - VITE_SUPABASE_PUBLISHABLE_KEY
 *  - SUPABASE_SECRET_KEY
 *
 * Usage:
 *
 *   import { it, adminClient } from '@/test/integration-fixtures'
 *
 *   describe('My integration test', () => {
 *     it('does something', async ({ client, user }) => {
 *       // client is signed in as user
 *     })
 *   })
 */
import { it as base } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/database.types'
import type { SupabaseClient } from '@/integrations/supabase/types'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Integration test requires env var ${name}. ` +
        `Run \`pnpm supabase start\` and ensure .env.local or .env.test is populated.`,
    )
  }
  return value
}

/**
 * A Supabase admin client using the secret service-role key.
 * Used internally to create/delete test users.
 * Exported for tests that need to seed or inspect DB state directly.
 */
export function createAdminClient() {
  return createClient<Database>(
    requireEnv('VITE_SUPABASE_URL'),
    requireEnv('SUPABASE_SECRET_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

export interface TestUser {
  id: string
  email: string
  password: string
}

async function createTestUser(
  adminClient: ReturnType<typeof createAdminClient>,
): Promise<TestUser> {
  const email = `test-${Date.now()}-${Math.random().toString(36).substring(2, 10)}@example.com`
  const password = 'test-password-123!'
  const {
    data: { user },
    error,
  } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create test user: ${error.message}`)
  if (!user) throw new Error('createUser returned no user')
  return { id: user.id, email, password }
}

async function deleteTestUser(
  adminClient: ReturnType<typeof createAdminClient>,
  id: string,
): Promise<void> {
  const { error } = await adminClient.auth.admin.deleteUser(id)
  if (error)
    throw new Error(`Failed to delete test user ${id}: ${error.message}`)
}

async function createSignedInClient(user: TestUser): Promise<SupabaseClient> {
  const client = createClient<Database>(
    requireEnv('VITE_SUPABASE_URL'),
    requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })
  if (error) throw new Error(`Failed to sign in test user: ${error.message}`)
  return client
}

/**
 * Extended Vitest `it` with `user` and `client` fixtures.
 *
 * Lifecycle:
 *  - Before each test: creates a new test user and signs in
 *  - After each test: deletes the test user (cascades to DB rows via FK)
 */
export const it = base.extend<{
  adminClient: ReturnType<typeof createAdminClient>
  user: TestUser
  client: SupabaseClient
}>({
  // eslint-disable-next-line no-empty-pattern
  adminClient: async ({}, use) => {
    await use(createAdminClient())
  },

  user: async ({ adminClient }, use) => {
    const user = await createTestUser(adminClient)
    await use(user)
    await deleteTestUser(adminClient, user.id)
  },

  client: async ({ user }, use) => {
    const client = await createSignedInClient(user)
    await use(client)
  },
})

export { describe, expect, beforeEach, afterEach } from 'vitest'
