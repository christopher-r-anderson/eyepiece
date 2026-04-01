import { afterEach, describe, expect } from 'vitest'
import { makeProfilesRepo } from './profiles.repo'
import { INVALID_INPUT_ERROR } from './profiles.utils'
import type { Profile } from '@/domain/profile/profile.schema'
import { createAdminClient, it } from '@/test/integration-fixtures'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedProfile(
  admin: ReturnType<typeof createAdminClient>,
  profile: Profile,
): Promise<void> {
  const { error } = await admin.from('profiles').insert({
    id: profile.id,
    display_name: profile.displayName,
  })
  if (error) throw new Error(`seedProfile: ${error.message}`)
}

async function cleanupProfile(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
): Promise<void> {
  const { error } = await admin.from('profiles').delete().eq('id', id)
  if (error) console.error(`cleanupProfile: ${error.message}`)
}

// ---------------------------------------------------------------------------
// getProfile
// ---------------------------------------------------------------------------

describe('makeProfilesRepo / getProfile', () => {
  const createdIds: Array<string> = []

  afterEach(async () => {
    for (const id of createdIds) await cleanupProfile(createAdminClient(), id)
    createdIds.length = 0
  })

  it('returns Ok(null) when the user has no profile', async ({
    client,
    user,
  }) => {
    const repo = makeProfilesRepo(client)

    const result = await repo.getProfile(user.id)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toBeNull()
    }
  })

  it('returns Ok(profile) with the correct shape when the profile exists', async ({
    client,
    user,
    adminClient,
  }) => {
    const profile: Profile = {
      id: user.id,
      displayName: 'Valentina Tereshkova',
    }
    await seedProfile(adminClient, profile)
    createdIds.push(user.id)

    const repo = makeProfilesRepo(client)
    const result = await repo.getProfile(user.id)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toEqual({
        id: user.id,
        displayName: 'Valentina Tereshkova',
      })
    }
  })

  it('returns Err with invalid_input code for an empty id', async ({
    client,
  }) => {
    const repo = makeProfilesRepo(client)

    const result = await repo.getProfile('')

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(INVALID_INPUT_ERROR)
    }
  })

  it('returns Ok(null) for a valid UUID that does not belong to any user', async ({
    client,
  }) => {
    const repo = makeProfilesRepo(client)

    const result = await repo.getProfile('00000000-dead-beef-cafe-000000000000')

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toBeNull()
    }
  })
})
