import { describe, expect, it, vi } from 'vitest'
import { makeUserFavoritesRepo } from './favorites.repo'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// Supabase query builder mock
//
// Supabase queries are fluent: .from().select().order().range()
// The builder needs to be:
//   - chainable (each method returns `this`) so intermediate calls work
//   - thenable so `await builder` resolves for queries that end at .order()
//   - .range() returns its own resolved promise for queries that go further
// ---------------------------------------------------------------------------

type DbResponse = { data: unknown; error: unknown; count?: number | null }

function makeQueryBuilder(response: DbResponse) {
  const resolved = Promise.resolve(response)
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnValue(resolved),
    // thenable: lets `await builder` resolve without calling .range()
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
    finally: resolved.finally.bind(resolved),
  }
  return builder
}

type QueryBuilder = ReturnType<typeof makeQueryBuilder>

function makeClientStub(response: DbResponse) {
  const builder = makeQueryBuilder(response)
  const client = { from: vi.fn().mockReturnValue(builder) }
  return { client, builder }
}

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440001'
const ANOTHER_UUID = '550e8400-e29b-41d4-a716-446655440002'

function makeDbEdgeRow(overrides?: {
  created_at?: string
  id?: string
  provider_id?: string
  external_id?: string
}) {
  return {
    created_at: overrides?.created_at ?? '2024-01-15T10:00:00+00:00',
    asset_preview_snapshots: {
      id: overrides?.id ?? VALID_UUID,
      provider_id: overrides?.provider_id ?? 'nasa_ivl',
      external_id: overrides?.external_id ?? 'asset-001',
    },
  }
}

function makeDbIndexRow(overrides?: {
  provider_id?: string
  external_id?: string
}) {
  return {
    asset_preview_snapshots: {
      provider_id: overrides?.provider_id ?? 'nasa_ivl',
      external_id: overrides?.external_id ?? 'asset-001',
    },
  }
}

function makePagination({ page = 1, pageSize = 10 } = {}) {
  return { page, pageSize }
}

const pgError = { message: 'connection refused', code: 'PGRST000' }

// ---------------------------------------------------------------------------
// getUserFavoritesEdges
// ---------------------------------------------------------------------------

describe('makeUserFavoritesRepo / getUserFavoritesEdges', () => {
  let client: ReturnType<typeof makeClientStub>['client']
  let builder: QueryBuilder

  function setup(response: DbResponse) {
    const stub = makeClientStub(response)
    client = stub.client
    builder = stub.builder
    return makeUserFavoritesRepo(client as any)
  }

  describe('querying', () => {
    it('queries the favorites table', async () => {
      const repo = setup({ data: [], error: null, count: 0 })
      await repo.getUserFavoritesEdges(makePagination())
      expect(client.from).toHaveBeenCalledWith('favorites')
    })

    it('selects created_at and the asset_preview_snapshots join fields', async () => {
      const repo = setup({ data: [], error: null, count: 0 })
      await repo.getUserFavoritesEdges(makePagination())
      expect(builder.select).toHaveBeenCalledWith(
        'created_at, asset_preview_snapshots (id, provider_id, external_id)',
        { count: 'exact' },
      )
    })

    it('orders by created_at descending', async () => {
      const repo = setup({ data: [], error: null, count: 0 })
      await repo.getUserFavoritesEdges(makePagination())
      expect(builder.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      })
    })

    it('uses .range() with correct offsets for a custom page and pageSize', async () => {
      const repo = setup({ data: [], error: null, count: 0 })
      await repo.getUserFavoritesEdges({ page: 3, pageSize: 10 })
      expect(builder.range).toHaveBeenCalledWith(20, 29)
    })
  })

  describe('success mapping', () => {
    it('returns Ok with a correctly mapped FavoriteEdge', async () => {
      const row = makeDbEdgeRow()
      const repo = setup({ data: [row], error: null, count: 1 })

      const result = await repo.getUserFavoritesEdges(makePagination())
      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.items).toHaveLength(1)
        expect(result.data.items[0]).toEqual({
          createdAt: '2024-01-15T10:00:00+00:00',
          assetSummaryId: VALID_UUID,
          assetKey: {
            providerId: 'nasa_ivl',
            externalId: 'asset-001',
          },
        })
      }
    })

    it('returns Ok with multiple correctly mapped edges', async () => {
      const rows = [
        makeDbEdgeRow({ id: VALID_UUID, external_id: 'asset-001' }),
        makeDbEdgeRow({ id: ANOTHER_UUID, external_id: 'asset-002' }),
      ]
      const repo = setup({ data: rows, error: null, count: 2 })

      const result = await repo.getUserFavoritesEdges(makePagination())

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.items).toHaveLength(2)
        expect(result.data.items[0].assetKey.externalId).toBe('asset-001')
        expect(result.data.items[1].assetKey.externalId).toBe('asset-002')
      }
    })

    it('returns Ok with an empty edges array when there are no results', async () => {
      const repo = setup({ data: [], error: null, count: 0 })

      const result = await repo.getUserFavoritesEdges(makePagination())

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.items).toEqual([])
      }
    })
  })

  describe('success pagination', () => {
    it('sets next to the next page number when more results exist', async () => {
      // 3 total, page 1 of size 2 → next = 2
      const repo = setup({
        data: [makeDbEdgeRow(), makeDbEdgeRow({ id: ANOTHER_UUID })],
        error: null,
        count: 3,
      })

      const result = await repo.getUserFavoritesEdges({ page: 1, pageSize: 2 })

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.pagination.next).toBe(2)
      }
    })

    it('sets next to null when on the last page (count equals page * pageSize)', async () => {
      // 2 total, page 1 of size 2 → no next
      const repo = setup({
        data: [makeDbEdgeRow(), makeDbEdgeRow({ id: ANOTHER_UUID })],
        error: null,
        count: 2,
      })

      const result = await repo.getUserFavoritesEdges({ page: 1, pageSize: 2 })

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.pagination.next).toBeNull()
      }
    })

    it('sets next to null when on the last page (count less than page * pageSize)', async () => {
      // 1 item left on page 2 of size 2
      const repo = setup({
        data: [makeDbEdgeRow()],
        error: null,
        count: 3,
      })

      const result = await repo.getUserFavoritesEdges({ page: 2, pageSize: 2 })

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.pagination.next).toBeNull()
      }
    })

    it('sets next to null when count is null', async () => {
      const repo = setup({ data: [], error: null, count: null })

      const result = await repo.getUserFavoritesEdges(makePagination())

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.pagination.next).toBeNull()
      }
    })
  })

  describe('errors', () => {
    it('returns Err when Postgres returns an error', async () => {
      const repo = setup({ data: null, error: pgError, count: null })

      const result = await repo.getUserFavoritesEdges(makePagination())

      expect(resultIsError(result)).toBe(true)
      if (resultIsError(result)) {
        expect(result.error.message).toBe(pgError.message)
        expect(result.error.cause).toBe(pgError)
      }
    })

    it('returns Err when the DB response fails Zod validation', async () => {
      // missing required asset_preview_snapshots.id field
      const badData = [
        {
          created_at: '2024-01-15T10:00:00+00:00',
          asset_preview_snapshots: { provider_id: 'nasa_ivl' },
        },
      ]
      const repo = setup({ data: badData, error: null, count: 1 })

      const result = await repo.getUserFavoritesEdges(makePagination())

      expect(resultIsError(result)).toBe(true)
    })

    it('returns Err when asset_preview_snapshots has an unrecognized provider_id', async () => {
      const badData = [makeDbEdgeRow({ provider_id: 'unknown_provider' })]
      const repo = setup({ data: badData, error: null, count: 1 })

      const result = await repo.getUserFavoritesEdges(makePagination())

      expect(resultIsError(result)).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// getUserFavoritesIndex
// ---------------------------------------------------------------------------

describe('makeUserFavoritesRepo / getUserFavoritesIndex', () => {
  let client: ReturnType<typeof makeClientStub>['client']
  let builder: QueryBuilder

  function setup(response: DbResponse) {
    const stub = makeClientStub(response)
    client = stub.client
    builder = stub.builder
    return makeUserFavoritesRepo(client as any)
  }

  describe('querying', () => {
    it('queries the favorites table', async () => {
      const repo = setup({ data: [], error: null })
      await repo.getUserFavoritesIndex()
      expect(client.from).toHaveBeenCalledWith('favorites')
    })

    it('selects only the asset_preview_snapshots provider_id and external_id', async () => {
      const repo = setup({ data: [], error: null })
      await repo.getUserFavoritesIndex()
      expect(builder.select).toHaveBeenCalledWith(
        'asset_preview_snapshots (provider_id, external_id)',
      )
    })

    it('orders by created_at descending', async () => {
      const repo = setup({ data: [], error: null })
      await repo.getUserFavoritesIndex()
      expect(builder.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      })
    })

    it('does not call .range() (fetches all rows)', async () => {
      const repo = setup({ data: [], error: null })
      await repo.getUserFavoritesIndex()
      expect(builder.range).not.toHaveBeenCalled()
    })
  })

  describe('success mapping', () => {
    it('returns Ok with a correctly mapped UserFavoriteIndex entry', async () => {
      const row = makeDbIndexRow()
      const repo = setup({ data: [row], error: null })

      const result = await repo.getUserFavoritesIndex()

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0]).toEqual({
          providerId: 'nasa_ivl',
          externalId: 'asset-001',
        })
      }
    })

    it('returns Ok with multiple mapped index entries', async () => {
      const rows = [
        makeDbIndexRow({ external_id: 'asset-001' }),
        makeDbIndexRow({ external_id: 'asset-002' }),
      ]
      const repo = setup({ data: rows, error: null })

      const result = await repo.getUserFavoritesIndex()

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data).toHaveLength(2)
        expect(result.data[0].externalId).toBe('asset-001')
        expect(result.data[1].externalId).toBe('asset-002')
      }
    })

    it('returns Ok with an empty array when the user has no favorites', async () => {
      const repo = setup({ data: [], error: null })

      const result = await repo.getUserFavoritesIndex()

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data).toEqual([])
      }
    })
  })

  describe('errors', () => {
    it('returns Err when Postgres returns an error', async () => {
      const repo = setup({ data: null, error: pgError })

      const result = await repo.getUserFavoritesIndex()

      expect(resultIsError(result)).toBe(true)
      if (resultIsError(result)) {
        expect(result.error.message).toBe(pgError.message)
        expect(result.error.cause).toBe(pgError)
      }
    })

    it('returns Err when the DB response fails Zod validation', async () => {
      // provider_id field missing entirely
      const badData = [
        { asset_preview_snapshots: { external_id: 'asset-001' } },
      ]
      const repo = setup({ data: badData, error: null })

      const result = await repo.getUserFavoritesIndex()

      expect(resultIsError(result)).toBe(true)
    })

    it('returns Err when asset_preview_snapshots has an unrecognized provider_id', async () => {
      const badData = [makeDbIndexRow({ provider_id: 'unknown_provider' })]
      const repo = setup({ data: badData, error: null })

      const result = await repo.getUserFavoritesIndex()

      expect(resultIsError(result)).toBe(true)
    })
  })
})
