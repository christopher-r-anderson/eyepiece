import { describe, expect, it, vi } from 'vitest'
import { makeProfilesCommands } from './profiles.commands'
import { INVALID_INPUT_ERROR, UNKNOWN_ERROR } from './profiles.utils'
import type { ProfileInput } from '@/lib/schemas/profile.schema'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// Supabase query builder mock
//
// The upsertProfile chain is: .from().upsert().select().limit().single()
// .single() is the terminal call that resolves the promise.
// ---------------------------------------------------------------------------

type DbResponse = { data: unknown; error: unknown }

function makeQueryBuilder(response: DbResponse) {
  const resolved = Promise.resolve(response)
  const builder = {
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnValue(resolved),
  }
  return builder
}

function makeClientStub(response: DbResponse) {
  const builder = makeQueryBuilder(response)
  const client = { from: vi.fn().mockReturnValue(builder) }
  return { client, builder }
}

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440001'

const VALID_INPUT: ProfileInput = {
  id: VALID_UUID,
  displayName: 'Ada Lovelace',
}

function makeDbRow(overrides?: { id?: string; display_name?: string }) {
  return {
    id: overrides?.id ?? VALID_UUID,
    display_name: overrides?.display_name ?? VALID_INPUT.displayName,
  }
}

const pgError = {
  message: 'connection refused',
  code: 'PGRST000',
  details: '',
  hint: '',
}

// ---------------------------------------------------------------------------
// upsertProfile — querying
// ---------------------------------------------------------------------------

describe('makeProfilesCommands / upsertProfile — querying', () => {
  it('queries the profiles table', async () => {
    const { client } = makeClientStub({ data: makeDbRow(), error: null })
    const commands = makeProfilesCommands(client as any)

    await commands.upsertProfile(VALID_INPUT)

    expect(client.from).toHaveBeenCalledWith('profiles')
  })

  it('calls upsert with the mapped database row', async () => {
    const { client, builder } = makeClientStub({
      data: makeDbRow(),
      error: null,
    })
    const commands = makeProfilesCommands(client as any)

    await commands.upsertProfile(VALID_INPUT)

    expect(builder.upsert).toHaveBeenCalledWith({
      id: VALID_UUID,
      display_name: 'Ada Lovelace',
    })
  })

  it('selects id and display_name after upsert', async () => {
    const { client, builder } = makeClientStub({
      data: makeDbRow(),
      error: null,
    })
    const commands = makeProfilesCommands(client as any)

    await commands.upsertProfile(VALID_INPUT)

    expect(builder.select).toHaveBeenCalledWith('id, display_name')
  })

  it('limits to 1 row', async () => {
    const { client, builder } = makeClientStub({
      data: makeDbRow(),
      error: null,
    })
    const commands = makeProfilesCommands(client as any)

    await commands.upsertProfile(VALID_INPUT)

    expect(builder.limit).toHaveBeenCalledWith(1)
  })

  it('uses single()', async () => {
    const { client, builder } = makeClientStub({
      data: makeDbRow(),
      error: null,
    })
    const commands = makeProfilesCommands(client as any)

    await commands.upsertProfile(VALID_INPUT)

    expect(builder.single).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// upsertProfile — success
// ---------------------------------------------------------------------------

describe('makeProfilesCommands / upsertProfile — success', () => {
  it('returns Ok with a mapped ProfileDisplay', async () => {
    const row = makeDbRow({ display_name: 'Ada Lovelace' })
    const { client } = makeClientStub({ data: row, error: null })
    const commands = makeProfilesCommands(client as any)

    const result = await commands.upsertProfile(VALID_INPUT)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toEqual({
        id: VALID_UUID,
        displayName: 'Ada Lovelace',
      })
    }
  })
})

// ---------------------------------------------------------------------------
// upsertProfile — errors
// ---------------------------------------------------------------------------

describe('makeProfilesCommands / upsertProfile — errors', () => {
  it('returns Err with UNKNOWN_ERROR on a generic database error', async () => {
    const { client } = makeClientStub({ data: null, error: pgError })
    const commands = makeProfilesCommands(client as any)

    const result = await commands.upsertProfile(VALID_INPUT)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(UNKNOWN_ERROR)
    }
  })

  it('maps profile_display_name_nonempty_check to INVALID_INPUT_ERROR with fieldErrors', async () => {
    const constraintError = {
      message: 'profile_display_name_nonempty_check',
      code: '23514',
      details: '',
      hint: '',
    }
    const { client } = makeClientStub({ data: null, error: constraintError })
    const commands = makeProfilesCommands(client as any)

    const result = await commands.upsertProfile(VALID_INPUT)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(INVALID_INPUT_ERROR)
      expect(result.error.fieldErrors?.['displayName']).toBeDefined()
    }
  })

  it('maps profile_display_name_length_check to INVALID_INPUT_ERROR with fieldErrors', async () => {
    const constraintError = {
      message: 'profile_display_name_length_check',
      code: '23514',
      details: '',
      hint: '',
    }
    const { client } = makeClientStub({ data: null, error: constraintError })
    const commands = makeProfilesCommands(client as any)

    const result = await commands.upsertProfile(VALID_INPUT)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(INVALID_INPUT_ERROR)
      expect(result.error.fieldErrors?.['displayName']).toBeDefined()
    }
  })
})
