import { describe, expect, it, vi } from 'vitest'
import { makeUserFavoritesRepo } from './favorites.repo'
import { encodeFavoritesEdgesCursor } from './favorites.cursor'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// Supabase query builder mock
//
// Supabase queries are fluent: .from().select().order().limit().or()
// The builder needs to be:
//   - chainable (each method returns `this`) so intermediate calls work
//   - thenable so `await builder` resolves wherever the chain ends
// ---------------------------------------------------------------------------

type DbResponse = { data: unknown; error: unknown; count?: number | null }

function makeQueryBuilder(response: DbResponse) {
  const resolved = Promise.resolve(response)
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnValue(resolved),
    // thenable: lets `await builder` resolve at any chain end
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

// getUserFavoritesEdges serves the page from the first builder; cursor
// pages make a second head-count query served by the second builder
function makeEdgesClientStub(
  pageResponse: { data: unknown; error: unknown; count?: number | null },
  countResponse: { count: number | null; error: unknown } = {
    count: 0,
    error: null,
  },
) {
  const pageBuilder = makeQueryBuilder({ ...pageResponse })
  const countBuilder = makeQueryBuilder({ data: null, ...countResponse })
  const client = {
    from: vi
      .fn()
      .mockReturnValueOnce(pageBuilder)
      .mockReturnValueOnce(countBuilder),
  }
  return { client, pageBuilder, countBuilder }
}

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440001'
const ANOTHER_UUID = '550e8400-e29b-41d4-a716-446655440002'
const THIRD_UUID = '550e8400-e29b-41d4-a716-446655440003'

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

const firstPage = { cursor: null, pageSize: 10 }

const pgError = { message: 'connection refused', code: 'PGRST000' }

// ---------------------------------------------------------------------------
// getUserFavoritesEdges
// ---------------------------------------------------------------------------

describe('makeUserFavoritesRepo / getUserFavoritesEdges', () => {
  let client: ReturnType<typeof makeEdgesClientStub>['client']
  let pageBuilder: QueryBuilder
  let countBuilder: QueryBuilder

  function setup(
    pageResponse: { data: unknown; error: unknown; count?: number | null },
    countResponse?: { count: number | null; error: unknown },
  ) {
    const stub = makeEdgesClientStub(pageResponse, countResponse)
    client = stub.client
    pageBuilder = stub.pageBuilder
    countBuilder = stub.countBuilder
    return makeUserFavoritesRepo(client as any)
  }

  describe('querying', () => {
    it('serves the first page and its count from a single request', async () => {
      const repo = setup({ data: [], error: null, count: 0 })
      await repo.getUserFavoritesEdges(firstPage)
      expect(client.from).toHaveBeenCalledTimes(1)
      expect(client.from).toHaveBeenCalledWith('favorites')
      expect(pageBuilder.select).toHaveBeenCalledWith(
        'created_at, asset_preview_snapshots (id, provider_id, external_id)',
        { count: 'exact' },
      )
    })

    it('counts a cursor page on a separate head query', async () => {
      const repo = setup({ data: [], error: null })
      await repo.getUserFavoritesEdges({
        cursor: encodeFavoritesEdgesCursor({
          createdAt: '2024-01-15T10:00:00+00:00',
          assetPreviewSnapshotId: VALID_UUID,
        }),
        pageSize: 10,
      })
      expect(client.from).toHaveBeenCalledTimes(2)
      expect(pageBuilder.select).toHaveBeenCalledWith(
        'created_at, asset_preview_snapshots (id, provider_id, external_id)',
        { count: undefined },
      )
      expect(countBuilder.select).toHaveBeenCalledWith('*', {
        count: 'exact',
        head: true,
      })
    })

    it('orders by created_at descending with the snapshot id tiebreaker', async () => {
      const repo = setup({ data: [], error: null })
      await repo.getUserFavoritesEdges(firstPage)
      expect(pageBuilder.order).toHaveBeenNthCalledWith(1, 'created_at', {
        ascending: false,
      })
      expect(pageBuilder.order).toHaveBeenNthCalledWith(
        2,
        'asset_preview_snapshot_id',
        { ascending: false },
      )
    })

    it('fetches one row past the page size', async () => {
      const repo = setup({ data: [], error: null })
      await repo.getUserFavoritesEdges({ cursor: null, pageSize: 24 })
      expect(pageBuilder.limit).toHaveBeenCalledWith(25)
    })

    it('applies no keyset filter on the first page', async () => {
      const repo = setup({ data: [], error: null })
      await repo.getUserFavoritesEdges(firstPage)
      expect(pageBuilder.or).not.toHaveBeenCalled()
    })

    it('applies the composite keyset filter for a cursor', async () => {
      const repo = setup({ data: [], error: null })
      const cursor = encodeFavoritesEdgesCursor({
        createdAt: '2024-01-15T10:00:00+00:00',
        assetPreviewSnapshotId: VALID_UUID,
      })
      await repo.getUserFavoritesEdges({ cursor, pageSize: 10 })
      expect(pageBuilder.or).toHaveBeenCalledWith(
        `created_at.lt."2024-01-15T10:00:00+00:00",and(created_at.eq."2024-01-15T10:00:00+00:00",asset_preview_snapshot_id.lt.${VALID_UUID})`,
      )
    })

    it('rejects an invalid cursor without querying', async () => {
      const repo = setup({ data: [], error: null })
      const result = await repo.getUserFavoritesEdges({
        cursor: 'not-a-cursor',
        pageSize: 10,
      })
      expect(resultIsError(result)).toBe(true)
      expect(client.from).not.toHaveBeenCalled()
    })
  })

  describe('success mapping', () => {
    it('returns Ok with a correctly mapped FavoriteEdge', async () => {
      const row = makeDbEdgeRow()
      const repo = setup({ data: [row], error: null, count: 1 })

      const result = await repo.getUserFavoritesEdges(firstPage)
      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.items).toHaveLength(1)
        expect(result.data.items[0]).toEqual({
          createdAt: '2024-01-15T10:00:00+00:00',
          assetPreviewSnapshotId: VALID_UUID,
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

      const result = await repo.getUserFavoritesEdges(firstPage)

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.items).toHaveLength(2)
        expect(result.data.items[0]?.assetKey.externalId).toBe('asset-001')
        expect(result.data.items[1]?.assetKey.externalId).toBe('asset-002')
      }
    })

    it('returns Ok with an empty edges array when there are no results', async () => {
      const repo = setup({ data: [], error: null })

      const result = await repo.getUserFavoritesEdges(firstPage)

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.items).toEqual([])
      }
    })
  })

  describe('success pagination', () => {
    it('sets next to the last served row cursor when an extra row comes back', async () => {
      // pageSize 2 fetches 3; the third row proves a next page and is dropped
      const repo = setup({
        data: [
          makeDbEdgeRow(),
          makeDbEdgeRow({ id: ANOTHER_UUID }),
          makeDbEdgeRow({ id: THIRD_UUID }),
        ],
        error: null,
        count: 3,
      })

      const result = await repo.getUserFavoritesEdges({
        cursor: null,
        pageSize: 2,
      })

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.items).toHaveLength(2)
        expect(result.data.pagination.next).toBe(
          `2024-01-15T10:00:00+00:00/${ANOTHER_UUID}`,
        )
        expect(result.data.pagination.total).toBe(3)
      }
    })

    it('sets next to null when no extra row comes back', async () => {
      const repo = setup({
        data: [makeDbEdgeRow(), makeDbEdgeRow({ id: ANOTHER_UUID })],
        error: null,
        count: 2,
      })

      const result = await repo.getUserFavoritesEdges({
        cursor: null,
        pageSize: 2,
      })

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.pagination.next).toBeNull()
      }
    })

    it('reports total 0 when count is null', async () => {
      const repo = setup({ data: [], error: null, count: null })

      const result = await repo.getUserFavoritesEdges(firstPage)

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data.pagination.total).toBe(0)
      }
    })
  })

  describe('errors', () => {
    it('returns Err when the page query returns an error', async () => {
      const repo = setup({ data: null, error: pgError })

      const result = await repo.getUserFavoritesEdges(firstPage)

      expect(resultIsError(result)).toBe(true)
      if (resultIsError(result)) {
        expect(result.error.message).toBe(pgError.message)
        expect(result.error.cause).toBe(pgError)
      }
    })

    it('returns Err when the count query returns an error', async () => {
      const repo = setup(
        { data: [], error: null },
        { count: null, error: pgError },
      )

      const result = await repo.getUserFavoritesEdges({
        cursor: encodeFavoritesEdgesCursor({
          createdAt: '2024-01-15T10:00:00+00:00',
          assetPreviewSnapshotId: VALID_UUID,
        }),
        pageSize: 10,
      })

      expect(resultIsError(result)).toBe(true)
    })

    it('returns Err when the DB response fails Zod validation', async () => {
      // missing required asset_preview_snapshots.id field
      const badData = [
        {
          created_at: '2024-01-15T10:00:00+00:00',
          asset_preview_snapshots: { provider_id: 'nasa_ivl' },
        },
      ]
      const repo = setup({ data: badData, error: null })

      const result = await repo.getUserFavoritesEdges(firstPage)

      expect(resultIsError(result)).toBe(true)
    })

    it('returns Err when asset_preview_snapshots has an unrecognized provider_id', async () => {
      const badData = [makeDbEdgeRow({ provider_id: 'unknown_provider' })]
      const repo = setup({ data: badData, error: null })

      const result = await repo.getUserFavoritesEdges(firstPage)

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
        expect(result.data[0]?.externalId).toBe('asset-001')
        expect(result.data[1]?.externalId).toBe('asset-002')
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
