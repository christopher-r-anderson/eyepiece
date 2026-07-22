import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EnsureAssetPreviewSnapshotErrorCodes } from './asset-preview-snapshots.const'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// asset-preview-snapshots.server.ts calls createServerOnlyFn() at module
// scope, which can throw in jsdom; mock @tanstack/react-start to make it a
// passthrough and stub the server-side client factories.

const SNAPSHOT_ID = '550e8400-e29b-41d4-a716-446655440001'
const ASSET_KEY: AssetKey = { providerId: 'nasa_ivl', externalId: 'PIA24439' }
const ASSET = {
  title: 'Apollo Footprint',
  thumbnail: { href: 'https://example.com/thumb.jpg', width: 640, height: 480 },
}

function makeServiceClient({
  lookupResponse,
  rpcResponse,
}: {
  lookupResponse: { data: unknown; error: unknown }
  rpcResponse?: { data: unknown; error: unknown }
}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(lookupResponse),
  }
  return {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn().mockResolvedValue(rpcResponse ?? { data: null, error: null }),
  }
}

async function setup() {
  vi.resetModules()

  vi.doMock('@tanstack/react-start', async (importOriginal) => {
    const actual: Record<string, unknown> = await importOriginal()
    return {
      ...actual,
      createServerOnlyFn: (fn: unknown) => fn,
      createServerFn: () => ({ handler: (fn: unknown) => fn }),
      createIsomorphicFn: () => ({
        server: (serverImpl: unknown) => ({
          client: () => serverImpl,
        }),
      }),
    }
  })
  vi.doMock('@/integrations/supabase/service', () => ({
    createServiceSupabaseClient: vi.fn(),
  }))
  vi.doMock('@/lib/eyepiece-api-client/client', () => ({
    createEyepieceClient: vi.fn(),
  }))

  const { _internals } = await import('./asset-preview-snapshots.server')
  return _internals.ensureAssetPreviewSnapshotForKey
}

describe('ensureAssetPreviewSnapshotForKey', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('reuses a fresh snapshot without fetching the asset', async () => {
    const ensure = await setup()
    const serviceClient = makeServiceClient({
      lookupResponse: {
        data: { id: SNAPSHOT_ID, updated_at: new Date().toISOString() },
        error: null,
      },
    })
    const eyepieceClient = { getAsset: vi.fn() }

    const result = await ensure(
      serviceClient as any,
      eyepieceClient as any,
      ASSET_KEY,
    )

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toBe(SNAPSHOT_ID)
    }
    expect(eyepieceClient.getAsset).not.toHaveBeenCalled()
    expect(serviceClient.rpc).not.toHaveBeenCalled()
  })

  it('refetches the asset and re-ensures when the snapshot is stale', async () => {
    const ensure = await setup()
    const eightDaysAgo = new Date(
      Date.now() - 8 * 24 * 60 * 60 * 1000,
    ).toISOString()
    const serviceClient = makeServiceClient({
      lookupResponse: {
        data: { id: 'stale-id', updated_at: eightDaysAgo },
        error: null,
      },
      rpcResponse: { data: SNAPSHOT_ID, error: null },
    })
    const eyepieceClient = { getAsset: vi.fn().mockResolvedValue(ASSET) }

    const result = await ensure(
      serviceClient as any,
      eyepieceClient as any,
      ASSET_KEY,
    )

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toBe(SNAPSHOT_ID)
    }
    expect(eyepieceClient.getAsset).toHaveBeenCalledWith(ASSET_KEY)
    expect(serviceClient.rpc).toHaveBeenCalledWith(
      'ensure_asset_preview_snapshot',
      {
        p_provider_id: ASSET_KEY.providerId,
        p_external_id: ASSET_KEY.externalId,
        p_title: ASSET.title,
        p_thumb_href: ASSET.thumbnail.href,
        p_thumb_width: ASSET.thumbnail.width,
        p_thumb_height: ASSET.thumbnail.height,
      },
    )
  })

  it('creates a snapshot when none exists', async () => {
    const ensure = await setup()
    const serviceClient = makeServiceClient({
      lookupResponse: { data: null, error: null },
      rpcResponse: { data: SNAPSHOT_ID, error: null },
    })
    const eyepieceClient = { getAsset: vi.fn().mockResolvedValue(ASSET) }

    const result = await ensure(
      serviceClient as any,
      eyepieceClient as any,
      ASSET_KEY,
    )

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toBe(SNAPSHOT_ID)
    }
  })

  it('returns Err when the snapshot lookup fails', async () => {
    const ensure = await setup()
    const serviceClient = makeServiceClient({
      lookupResponse: { data: null, error: { message: 'boom' } },
    })
    const eyepieceClient = { getAsset: vi.fn() }

    const result = await ensure(
      serviceClient as any,
      eyepieceClient as any,
      ASSET_KEY,
    )

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(
        EnsureAssetPreviewSnapshotErrorCodes.UNKNOWN_ERROR,
      )
    }
    expect(eyepieceClient.getAsset).not.toHaveBeenCalled()
  })

  it('returns Err when the asset fetch throws', async () => {
    const ensure = await setup()
    const serviceClient = makeServiceClient({
      lookupResponse: { data: null, error: null },
    })
    const eyepieceClient = {
      getAsset: vi.fn().mockRejectedValue(new Error('fetch failed')),
    }

    const result = await ensure(
      serviceClient as any,
      eyepieceClient as any,
      ASSET_KEY,
    )

    expect(resultIsError(result)).toBe(true)
    expect(serviceClient.rpc).not.toHaveBeenCalled()
  })

  it('returns Err when the ensure RPC fails', async () => {
    const ensure = await setup()
    const serviceClient = makeServiceClient({
      lookupResponse: { data: null, error: null },
      rpcResponse: { data: null, error: { message: 'rpc boom' } },
    })
    const eyepieceClient = { getAsset: vi.fn().mockResolvedValue(ASSET) }

    const result = await ensure(
      serviceClient as any,
      eyepieceClient as any,
      ASSET_KEY,
    )

    expect(resultIsError(result)).toBe(true)
  })

  it('returns Err when the RPC succeeds without an id', async () => {
    const ensure = await setup()
    const serviceClient = makeServiceClient({
      lookupResponse: { data: null, error: null },
      rpcResponse: { data: null, error: null },
    })
    const eyepieceClient = { getAsset: vi.fn().mockResolvedValue(ASSET) }

    const result = await ensure(
      serviceClient as any,
      eyepieceClient as any,
      ASSET_KEY,
    )

    expect(resultIsError(result)).toBe(true)
  })
})
