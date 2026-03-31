import { describe, expect, it, vi } from 'vitest'
import { makeAssetPreviewSnapshotsRepo } from './asset-preview-snapshots.repo'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// Supabase query builder mock
//
// The asset-summaries query chain is: .from().select().in()
// .in() is the terminal call that resolves the promise.
// ---------------------------------------------------------------------------

type DbResponse = { data: unknown; error: unknown }

function makeClientStub(response: DbResponse) {
  const resolved = Promise.resolve(response)
  const builder = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnValue(resolved),
  }
  const client = { from: vi.fn().mockReturnValue(builder) }
  return { client, builder }
}

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const UUID_1 = '550e8400-e29b-41d4-a716-446655440001'
const UUID_2 = '550e8400-e29b-41d4-a716-446655440002'

function makeDbRow(overrides?: {
  id?: string
  provider_id?: string
  external_id?: string
  title?: string | null
  thumb_href?: string
  thumb_width?: number
  thumb_height?: number
}) {
  return {
    id: overrides?.id ?? UUID_1,
    provider_id: overrides?.provider_id ?? 'nasa_ivl',
    external_id: overrides?.external_id ?? 'asset-001',
    title: overrides?.title !== undefined ? overrides.title : 'A Title',
    thumb_href: overrides?.thumb_href ?? 'https://example.com/thumb.jpg',
    thumb_width: overrides?.thumb_width ?? 320,
    thumb_height: overrides?.thumb_height ?? 240,
  }
}

const pgError = { message: 'relation does not exist', code: 'PGRST200' }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('makeAssetSummariesRepo / getAssetSummaries', () => {
  describe('querying', () => {
    it('queries the asset_preview_snapshots table', async () => {
      const { client } = makeClientStub({ data: [], error: null })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      await repo.getAssetPreviewSnapshots([UUID_1])

      expect(client.from).toHaveBeenCalledWith('asset_preview_snapshots')
    })

    it('selects the expected fields', async () => {
      const { client, builder } = makeClientStub({ data: [], error: null })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      await repo.getAssetPreviewSnapshots([UUID_1])

      expect(builder.select).toHaveBeenCalledWith(
        'id, provider_id, external_id, title, thumb_href, thumb_width, thumb_height',
      )
    })

    it('passes the provided IDs to .in()', async () => {
      const { client, builder } = makeClientStub({ data: [], error: null })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      await repo.getAssetPreviewSnapshots([UUID_1, UUID_2])

      expect(builder.in).toHaveBeenCalledWith('id', [UUID_1, UUID_2])
    })
  })

  describe('success — mapping', () => {
    it('returns Ok with a correctly mapped AssetSummary', async () => {
      const row = makeDbRow()
      const { client } = makeClientStub({ data: [row], error: null })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      const result = await repo.getAssetPreviewSnapshots([UUID_1])

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0]).toEqual({
          id: UUID_1,
          key: {
            providerId: 'nasa_ivl',
            externalId: 'asset-001',
          },
          title: 'A Title',
          thumbnail: {
            href: 'https://example.com/thumb.jpg',
            width: 320,
            height: 240,
          },
        })
      }
    })

    it('substitutes "No Title" when the DB title is null', async () => {
      const row = makeDbRow({ title: null })
      const { client } = makeClientStub({ data: [row], error: null })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      const result = await repo.getAssetPreviewSnapshots([UUID_1])

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data[0].title).toBe('No Title')
      }
    })

    it('preserves a non-null title as-is', async () => {
      const row = makeDbRow({ title: 'Hubble Deep Field' })
      const { client } = makeClientStub({ data: [row], error: null })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      const result = await repo.getAssetPreviewSnapshots([UUID_1])

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data[0].title).toBe('Hubble Deep Field')
      }
    })

    it('returns Ok with multiple mapped summaries', async () => {
      const rows = [
        makeDbRow({ id: UUID_1, external_id: 'asset-001' }),
        makeDbRow({ id: UUID_2, external_id: 'asset-002' }),
      ]
      const { client } = makeClientStub({ data: rows, error: null })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      const result = await repo.getAssetPreviewSnapshots([UUID_1, UUID_2])

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data).toHaveLength(2)
        expect(result.data[0].key.externalId).toBe('asset-001')
        expect(result.data[1].key.externalId).toBe('asset-002')
      }
    })

    it('returns Ok with an empty array when no IDs match', async () => {
      const { client } = makeClientStub({ data: [], error: null })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      const result = await repo.getAssetPreviewSnapshots([UUID_1])

      expect(resultIsSuccess(result)).toBe(true)
      if (resultIsSuccess(result)) {
        expect(result.data).toEqual([])
      }
    })
  })

  describe('errors', () => {
    it('returns Err when Postgres returns an error', async () => {
      const { client } = makeClientStub({ data: null, error: pgError })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      const result = await repo.getAssetPreviewSnapshots([UUID_1])

      expect(resultIsError(result)).toBe(true)
      if (resultIsError(result)) {
        expect(result.error.message).toBe(pgError.message)
        expect(result.error.cause).toBe(pgError)
      }
    })

    it('returns Err when the DB response fails Zod validation', async () => {
      // thumb_href is not a URL
      const badRow = makeDbRow({ thumb_href: 'not-a-url' })
      const { client } = makeClientStub({ data: [badRow], error: null })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      const result = await repo.getAssetPreviewSnapshots([UUID_1])

      expect(resultIsError(result)).toBe(true)
    })

    it('returns Err when the provider_id is not a recognized value', async () => {
      const badRow = makeDbRow({ provider_id: 'unknown_provider' })
      const { client } = makeClientStub({ data: [badRow], error: null })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      const result = await repo.getAssetPreviewSnapshots([UUID_1])

      expect(resultIsError(result)).toBe(true)
    })

    it('returns Err when thumb dimensions are not positive integers', async () => {
      const badRow = makeDbRow({ thumb_width: 0 })
      const { client } = makeClientStub({ data: [badRow], error: null })
      const repo = makeAssetPreviewSnapshotsRepo(client as any)

      const result = await repo.getAssetPreviewSnapshots([UUID_1])

      expect(resultIsError(result)).toBe(true)
    })
  })
})
