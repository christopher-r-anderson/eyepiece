import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return Object.assign({}, actual as object, {
    createFileRoute: () => (config: unknown) => config,
    useRouterState: vi.fn(),
  })
})

const mockEnsureAsset = vi.fn()
vi.mock('@/features/assets/assets.queries', () => ({
  ensureAsset: mockEnsureAsset,
  useSuspenseAsset: vi.fn(),
}))

vi.mock('@/lib/utils', () => ({
  getTitleText: (title: string) => `Eyepiece | ${title}`,
}))

const { Route } = await import('./$providerId.$assetId')
const route = Route as any

describe('asset page route', () => {
  beforeEach(() => {
    mockEnsureAsset.mockReset()
    mockEnsureAsset.mockResolvedValue({ title: 'The Blue Marble' })
  })

  it('parses providerId and assetId params', () => {
    const params = route.params.parse({
      providerId: NASA_IVL_PROVIDER_ID,
      assetId: 'AS17-148-22727',
    })

    expect(params).toEqual({
      providerId: NASA_IVL_PROVIDER_ID,
      assetId: 'AS17-148-22727',
    })
  })

  it('rejects invalid provider ids in params', () => {
    expect(() =>
      route.params.parse({ providerId: 'bad', assetId: 'AS17-148-22727' }),
    ).toThrow()
  })

  it('builds an assetKey in beforeLoad', () => {
    const result = route.beforeLoad({
      params: { providerId: NASA_IVL_PROVIDER_ID, assetId: 'AS17-148-22727' },
    })

    expect(result).toEqual({
      assetKey: {
        providerId: NASA_IVL_PROVIDER_ID,
        externalId: 'AS17-148-22727',
      },
    })
  })

  it('loads asset details and returns title', async () => {
    const assetKey = {
      providerId: NASA_IVL_PROVIDER_ID,
      externalId: 'AS17-148-22727',
    }
    const eyepieceClient = { request: vi.fn() }
    const queryClient = { ensureQueryData: vi.fn() }

    const result = await route.loader({
      context: { assetKey, eyepieceClient, queryClient },
    })

    expect(mockEnsureAsset).toHaveBeenCalledWith({
      assetKey,
      eyepieceClient,
      queryClient,
    })
    expect(result).toEqual({ title: 'The Blue Marble' })
  })

  it('uses asset title in head metadata and falls back when missing', () => {
    expect(route.head({ loaderData: { title: 'Apollo 11' } }).meta).toEqual([
      { title: 'Eyepiece | Apollo 11' },
    ])

    expect(route.head({ loaderData: undefined }).meta).toEqual([
      { title: 'Eyepiece | NASA Media' },
    ])
  })
})
