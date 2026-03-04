import { it as base, describe, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { makeUpsertProfile } from './profile-service'
import { INVALID_INPUT_ERROR } from './profiles.utils'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/database.types'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// Example integration test for evaluation w/ https://github.com/christopher-r-anderson/eyepiece/issues/48

const adminClient = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
)

interface UserInfo {
  id: string
  email: string
  password: string
}

const it = base.extend<{
  client: SupabaseClient<Database>
  user: UserInfo
}>({
  // eslint-disable-next-line no-empty-pattern
  user: async ({}, use) => {
    const { id, email, password } = await createUser()
    await use({ id, email, password })
  },
  client: async ({ user }, use) => {
    const client = await createSignedInClient(user)
    await use(client)
    await deleteUser({ id: user.id })
  },
})

async function createUser() {
  const email = `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}@example.com`
  const password = '123password123'
  const {
    data: { user: createdUser },
    error: createUserError,
  } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createUserError) throw createUserError
  if (!createdUser) throw new Error('Failed to create test user')
  return { email, password, id: createdUser.id }
}

async function createSignedInClient({ email, password }: UserInfo) {
  const client = createClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
  const {
    data: { user },
    error,
  } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  if (!user) throw new Error('Failed to sign in test user')
  return client
}

async function deleteUser({ id }: { id: string }) {
  const { error } = await adminClient.auth.admin.deleteUser(id)
  if (error) throw error
}

describe('Profile Service Integration', () => {
  it('good input returns a profile', async ({ client, user }) => {
    const displayName = 'Valid Name'
    const result = await makeUpsertProfile(client)({
      id: user.id,
      displayName,
    })

    expect(resultIsSuccess(result)).toBe(true)

    if (resultIsSuccess(result)) {
      expect(result.data).toMatchObject({
        id: user.id,
        displayName,
      })
    }
  })

  it('bad input returns an input error', async ({ client, user }) => {
    const result = await makeUpsertProfile(client)({
      id: user.id,
      displayName: '   ',
    })

    if (resultIsError(result)) {
      expect(result.error).toMatchObject({
        code: INVALID_INPUT_ERROR,
        fieldErrors: {
          displayName: expect.any(String),
        },
      })
    }
  })
})
