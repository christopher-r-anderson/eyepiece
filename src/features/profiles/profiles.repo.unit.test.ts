import { describe, expect, it, vi } from 'vitest'
import { makeProfilesRepo } from './profiles.repo'
import { INVALID_INPUT_ERROR, UNKNOWN_ERROR } from './profiles.utils'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// Supabase query builder mock
//
// The getProfile chain is: .from().select().eq().maybeSingle()
// .maybeSingle() is the terminal call that resolves the promise.
// ---------------------------------------------------------------------------

type DbResponse = { data: unknown; error: unknown }

function makeQueryBuilder(response: DbResponse) {
  const resolved = Promise.resolve(response)
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnValue(resolved),
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

function makeDbRow(overrides?: { id?: string; display_name?: string }) {
  return {
    id: overrides?.id ?? VALID_UUID,
    display_name: overrides?.display_name ?? 'Test User',
  }
}

const pgError = {
  message: 'connection refused',
  code: 'PGRST000',
  details: '',
  hint: '',
}

// ---------------------------------------------------------------------------
// getProfile — guard: invalid id
// ---------------------------------------------------------------------------

describe('makeProfilesRepo / getProfile — invalid id', () => {
  it('returns Err with INVALID_INPUT_ERROR for an empty string id', async () => {
    const { client } = makeClientStub({ data: null, error: null })
    const repo = makeProfilesRepo(client as any)

    const result = await repo.getProfile('')

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(INVALID_INPUT_ERROR)
    }
  })

  it('does not call the database for an empty string id', async () => {
    const { client } = makeClientStub({ data: null, error: null })
    const repo = makeProfilesRepo(client as any)

    await repo.getProfile('')

    expect(client.from).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// getProfile — querying
// ---------------------------------------------------------------------------

describe('makeProfilesRepo / getProfile — querying', () => {
  it('queries the profiles table', async () => {
    const { client } = makeClientStub({ data: null, error: null })
    const repo = makeProfilesRepo(client as any)

    await repo.getProfile(VALID_UUID)

    expect(client.from).toHaveBeenCalledWith('profiles')
  })

  it('selects id and display_name', async () => {
    const { client, builder } = makeClientStub({ data: null, error: null })
    const repo = makeProfilesRepo(client as any)

    await repo.getProfile(VALID_UUID)

    expect(builder.select).toHaveBeenCalledWith('id, display_name')
  })

  it('filters by the provided id', async () => {
    const { client, builder } = makeClientStub({ data: null, error: null })
    const repo = makeProfilesRepo(client as any)

    await repo.getProfile(VALID_UUID)

    expect(builder.eq).toHaveBeenCalledWith('id', VALID_UUID)
  })

  it('uses maybeSingle()', async () => {
    const { client, builder } = makeClientStub({ data: null, error: null })
    const repo = makeProfilesRepo(client as any)

    await repo.getProfile(VALID_UUID)

    expect(builder.maybeSingle).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// getProfile — success cases
// ---------------------------------------------------------------------------

describe('makeProfilesRepo / getProfile — success', () => {
  it('returns Ok(null) when no row is found', async () => {
    const { client } = makeClientStub({ data: null, error: null })
    const repo = makeProfilesRepo(client as any)

    const result = await repo.getProfile(VALID_UUID)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toBeNull()
    }
  })

  it('returns Ok with a mapped ProfileDisplay when a row is found', async () => {
    const row = makeDbRow({ display_name: 'Alan Turing' })
    const { client } = makeClientStub({ data: row, error: null })
    const repo = makeProfilesRepo(client as any)

    const result = await repo.getProfile(VALID_UUID)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toEqual({
        id: VALID_UUID,
        displayName: 'Alan Turing',
      })
    }
  })
})

// ---------------------------------------------------------------------------
// getProfile — error cases
// ---------------------------------------------------------------------------

describe('makeProfilesRepo / getProfile — errors', () => {
  it('returns Err with UNKNOWN_ERROR on a database error', async () => {
    const { client } = makeClientStub({ data: null, error: pgError })
    const repo = makeProfilesRepo(client as any)

    const result = await repo.getProfile(VALID_UUID)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(UNKNOWN_ERROR)
    }
  })

  it('maps a known validation constraint to INVALID_INPUT_ERROR', async () => {
    const constraintError = {
      message: 'profile_display_name_nonempty_check',
      code: '23514',
      details: '',
      hint: '',
    }
    const { client } = makeClientStub({ data: null, error: constraintError })
    const repo = makeProfilesRepo(client as any)

    const result = await repo.getProfile(VALID_UUID)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(INVALID_INPUT_ERROR)
    }
  })
})
