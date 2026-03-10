import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToggleFavoriteErrorCodes } from './favorites.const'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// Module-level setup
//
// favorites.server.ts calls createServerOnlyFn() at module scope, which can
// throw in jsdom. We mock @tanstack/react-start to make it a passthrough, and
// mock the other server-side client factories that are not under test here.
// We use vi.resetModules() + vi.doMock() + dynamic import per test group so
// each setup gets a fresh module with controlled dependencies.
// ---------------------------------------------------------------------------

const ASSET_SUMMARY_ID = '550e8400-e29b-41d4-a716-446655440001'
const USER_ID = '550e8400-e29b-41d4-a716-446655440099'

function mockReactStart() {
  vi.doMock('@tanstack/react-start', async (importOriginal) => {
    const actual: Record<string, unknown> = await importOriginal()

    return {
      ...actual,
      createServerOnlyFn: (fn: unknown) => fn,
      createServerFn: () => ({ handler: (fn: unknown) => fn }),
      // Required by src/lib/utils.ts during module evaluation.
      createIsomorphicFn: () => ({
        server: (serverImpl: unknown) => ({
          client: () => serverImpl,
        }),
      }),
    }
  })
}

// ---------------------------------------------------------------------------
// Supabase mock builders
//
// toggleFavoriteForUser makes two separate client.from('favorites') calls:
//   1. delete chain: .from().delete().eq().eq() →  { count, error }
//   2. insert chain: .from().insert(...) →  { error }
//
// We use mockReturnValueOnce so each call to .from() gets its own builder.
// The delete builder is made thenable so `await chain` resolves correctly.
// ---------------------------------------------------------------------------

function makeDeleteBuilder(response: { count: number | null; error: unknown }) {
  const resolved = Promise.resolve(response)
  return {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
    finally: resolved.finally.bind(resolved),
  }
}

function makeInsertBuilder(response: { error: unknown }) {
  const resolved = Promise.resolve(response)
  return {
    insert: vi.fn().mockReturnValue(resolved),
  }
}

function makeClient({
  deleteResponse,
  insertResponse,
}: {
  deleteResponse: { count: number | null; error: unknown }
  insertResponse?: { error: unknown }
}) {
  const deleteBuilder = makeDeleteBuilder(deleteResponse)
  const insertBuilder = insertResponse
    ? makeInsertBuilder(insertResponse)
    : undefined

  const from = vi.fn().mockReturnValueOnce(deleteBuilder)
  if (insertBuilder) {
    from.mockReturnValueOnce(insertBuilder)
  }

  return { from }
}

// ---------------------------------------------------------------------------
// toggleFavoriteForUser
// ---------------------------------------------------------------------------

async function setupToggleFavoriteForUser() {
  vi.resetModules()

  mockReactStart()
  vi.doMock('@/integrations/supabase/service', () => ({
    createServiceSupabaseClient: vi.fn(),
  }))
  vi.doMock('@/integrations/supabase/user', () => ({
    createUserSupabaseClient: vi.fn(),
  }))
  vi.doMock('@/features/auth/get-user', () => ({
    getUser: vi.fn(),
  }))

  const { _internals } = await import('./favorites.server')
  return {
    toggleFavoriteForUser: _internals.toggleFavoriteForUser,
    ToggleFavoriteErrorCodes,
  }
}

describe('toggleFavoriteForUser', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns Ok with isFavorited: false when the favorite is deleted (count = 1)', async () => {
    const { toggleFavoriteForUser } = await setupToggleFavoriteForUser()
    const client = makeClient({ deleteResponse: { count: 1, error: null } })

    const result = await toggleFavoriteForUser(
      client as any,
      USER_ID,
      ASSET_SUMMARY_ID,
    )

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toEqual({
        assetSummaryId: ASSET_SUMMARY_ID,
        isFavorited: false,
      })
    }
  })

  it('returns Ok with isFavorited: true when nothing was deleted and insert succeeds', async () => {
    const { toggleFavoriteForUser } = await setupToggleFavoriteForUser()
    const client = makeClient({
      deleteResponse: { count: 0, error: null },
      insertResponse: { error: null },
    })

    const result = await toggleFavoriteForUser(
      client as any,
      USER_ID,
      ASSET_SUMMARY_ID,
    )

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toEqual({
        assetSummaryId: ASSET_SUMMARY_ID,
        isFavorited: true,
      })
    }
  })

  it('returns Ok with isFavorited: true when insert fails with 23505 (race condition)', async () => {
    const { toggleFavoriteForUser } = await setupToggleFavoriteForUser()
    const client = makeClient({
      deleteResponse: { count: 0, error: null },
      insertResponse: {
        error: { code: '23505', message: 'duplicate key value' },
      },
    })

    const result = await toggleFavoriteForUser(
      client as any,
      USER_ID,
      ASSET_SUMMARY_ID,
    )

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data.isFavorited).toBe(true)
    }
  })

  it('returns Err when the delete query fails', async () => {
    const { toggleFavoriteForUser } = await setupToggleFavoriteForUser()
    const pgError = { code: 'PGRST301', message: 'permission denied' }
    const client = makeClient({
      deleteResponse: { count: null, error: pgError },
    })

    const result = await toggleFavoriteForUser(
      client as any,
      USER_ID,
      ASSET_SUMMARY_ID,
    )

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.message).toBe(ToggleFavoriteErrorCodes.UNKNOWN_ERROR)
      expect(result.error.cause).toBe(pgError)
    }
  })

  it('returns Err when the insert fails with a non-uniqueness error', async () => {
    const { toggleFavoriteForUser } = await setupToggleFavoriteForUser()
    const pgError = { code: 'PGRST301', message: 'permission denied' }
    const client = makeClient({
      deleteResponse: { count: 0, error: null },
      insertResponse: { error: pgError },
    })

    const result = await toggleFavoriteForUser(
      client as any,
      USER_ID,
      ASSET_SUMMARY_ID,
    )

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.message).toBe(ToggleFavoriteErrorCodes.UNKNOWN_ERROR)
      expect(result.error.cause).toBe(pgError)
    }
  })

  it('calls delete with the correct owner_id and asset_summary_id', async () => {
    const { toggleFavoriteForUser } = await setupToggleFavoriteForUser()
    const deleteBuilder = makeDeleteBuilder({ count: 1, error: null })
    const from = vi.fn().mockReturnValue(deleteBuilder)

    await toggleFavoriteForUser({ from } as any, USER_ID, ASSET_SUMMARY_ID)

    expect(deleteBuilder.delete).toHaveBeenCalledWith({ count: 'exact' })
    expect(deleteBuilder.eq).toHaveBeenCalledWith('owner_id', USER_ID)
    expect(deleteBuilder.eq).toHaveBeenCalledWith(
      'asset_summary_id',
      ASSET_SUMMARY_ID,
    )
  })

  it('does not attempt an insert when the favorite is deleted (count = 1)', async () => {
    const { toggleFavoriteForUser } = await setupToggleFavoriteForUser()
    const deleteBuilder = makeDeleteBuilder({ count: 1, error: null })
    const insertBuilder = makeInsertBuilder({ error: null })
    const from = vi
      .fn()
      .mockReturnValueOnce(deleteBuilder)
      .mockReturnValueOnce(insertBuilder)

    await toggleFavoriteForUser({ from } as any, USER_ID, ASSET_SUMMARY_ID)

    expect(insertBuilder.insert).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// toggleUserFavorite — auth guard
// ---------------------------------------------------------------------------

async function setupToggleUserFavorite(user: { id: string } | null) {
  vi.resetModules()

  mockReactStart()
  vi.doMock('@/integrations/supabase/service', () => ({
    createServiceSupabaseClient: vi.fn(),
  }))
  vi.doMock('@/features/auth/get-user', () => ({
    getUser: vi.fn().mockResolvedValue(user),
  }))

  // When user is present, provide a mock client via createUserSupabaseClient
  const mockUserClient = makeClient({
    deleteResponse: { count: 1, error: null },
  })
  vi.doMock('@/integrations/supabase/user', () => ({
    createUserSupabaseClient: vi.fn().mockReturnValue(mockUserClient),
  }))

  const { _internals } = await import('./favorites.server')
  return {
    toggleUserFavorite: _internals.toggleUserFavorite,
    ToggleFavoriteErrorCodes,
  }
}

describe('toggleUserFavorite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns Err with AUTH_REQUIRED when there is no authenticated user', async () => {
    const { toggleUserFavorite } = await setupToggleUserFavorite(null)

    const result = await toggleUserFavorite(ASSET_SUMMARY_ID)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.message).toBe(ToggleFavoriteErrorCodes.AUTH_REQUIRED)
    }
  })

  it('delegates to toggleFavoriteForUser when a user is authenticated', async () => {
    const { toggleUserFavorite } = await setupToggleUserFavorite({
      id: USER_ID,
    })

    const result = await toggleUserFavorite(ASSET_SUMMARY_ID)

    // The mock client deletes with count=1, so the result should be unfavorited
    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toEqual({
        assetSummaryId: ASSET_SUMMARY_ID,
        isFavorited: false,
      })
    }
  })
})
