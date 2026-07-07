import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'

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

vi.mock('../-components/favorite-button', () => ({
  FavoriteButton: () => createElement('button', { type: 'button' }, 'favorite'),
}))

vi.mock('./-components/metadata/button', () => ({
  MetadataButton: () => createElement('button', { type: 'button' }, 'metadata'),
}))

vi.mock('./-components/asset-detail', () => ({
  AssetDetail: () => createElement('div', null, 'asset detail'),
}))

vi.mock('@/components/ui/link', () => ({
  Link: ({ children }: { children: ReactNode }) =>
    createElement('a', null, children),
}))

vi.mock('@/lib/utils', () => ({
  getTitleText: (title: string) => `Eyepiece | ${title}`,
}))

const { Route } = await import('./$providerId.$assetId')
const route = Route as any
const mockUseSuspenseAsset = vi.mocked(
  (await import('@/features/assets/assets.queries')).useSuspenseAsset,
)

afterEach(() => {
  cleanup()
})

describe('asset page component', () => {
  beforeEach(() => {
    route.useRouteContext = vi.fn()
    mockUseSuspenseAsset.mockReset()
    mockUseSuspenseAsset.mockReturnValue({
      data: {
        key: { providerId: NASA_IVL_PROVIDER_ID, externalId: 'AS17-148-22727' },
        title: 'The Blue Marble',
      },
    } as ReturnType<typeof mockUseSuspenseAsset>)
  })

  it('shows the metadata button for providers with metadata support', () => {
    route.useRouteContext.mockReturnValue({
      assetKey: {
        providerId: NASA_IVL_PROVIDER_ID,
        externalId: 'AS17-148-22727',
      },
    })

    render(route.component())

    expect(screen.getByRole('button', { name: 'metadata' })).toBeTruthy()
  })

  it('hides the metadata button for providers without metadata support', () => {
    route.useRouteContext.mockReturnValue({
      assetKey: {
        providerId: SI_OA_PROVIDER_ID,
        externalId: 'ld1-1643400021979-1643400026497-0',
      },
    })
    mockUseSuspenseAsset.mockReturnValue({
      data: {
        key: {
          providerId: SI_OA_PROVIDER_ID,
          externalId: 'ld1-1643400021979-1643400026497-0',
        },
        title: 'Smithsonian Asset',
      },
    } as ReturnType<typeof mockUseSuspenseAsset>)

    render(route.component())

    expect(screen.queryByRole('button', { name: 'metadata' })).toBeNull()
  })
})

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
