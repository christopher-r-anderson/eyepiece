import { describe, expect } from 'vitest'
import { makeProfilesCommands } from './profiles.commands'
import { INVALID_INPUT_ERROR } from './profiles.utils'
import type { Profile } from '@/domain/profile/profile.schema'
import { it } from '@/test/integration-fixtures'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// upsertProfile
// ---------------------------------------------------------------------------

describe('makeProfilesCommands / upsertProfile', () => {
  it('creates a new profile and returns Ok with the persisted data', async ({
    client,
    user,
  }) => {
    const commands = makeProfilesCommands(client)
    const profile: Profile = { id: user.id, displayName: 'Mae Jemison' }

    const result = await commands.upsertProfile(profile)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toEqual({ id: user.id, displayName: 'Mae Jemison' })
    }
  })

  it('updates an existing profile and returns Ok with the new display name', async ({
    client,
    user,
  }) => {
    const commands = makeProfilesCommands(client)
    const original: Profile = { id: user.id, displayName: 'Sally Ride' }
    await commands.upsertProfile(original)

    const updated: Profile = { id: user.id, displayName: 'Sally K. Ride' }
    const result = await commands.upsertProfile(updated)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data.displayName).toBe('Sally K. Ride')
    }
  })

  it('returns Err when the display name exceeds the database length constraint', async ({
    client,
    user,
  }) => {
    const commands = makeProfilesCommands(client)
    const profile: Profile = {
      id: user.id,
      displayName: 'A'.repeat(61), // DB enforces ≤ 60 characters
    }

    const result = await commands.upsertProfile(profile)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      // The constraint violation should map to an input validation error.
      // If this assertion fails it indicates the constraint-name mapping in
      // profiles.utils.ts is out of sync with the current DB migration.
      expect(result.error.code).toBe(INVALID_INPUT_ERROR)
    }
  })

  it('returns Err when the display name is blank (whitespace-only)', async ({
    client,
    user,
  }) => {
    const commands = makeProfilesCommands(client)
    const profile: Profile = { id: user.id, displayName: '   ' }

    const result = await commands.upsertProfile(profile)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(INVALID_INPUT_ERROR)
    }
  })
})
