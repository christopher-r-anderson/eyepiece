import { createElement } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getInfiniteCollectionItemEdgesOptions,
  getInfiniteUserCollectionItemEdgesOptions,
  getUserCollectionCardsOptions,
  useCreateCollection,
  useRemoveCollectionItem,
  useRenameCollection,
} from './collections.queries'
import {
  createCollectionFn,
  removeCollectionItemFn,
  renameCollectionFn,
} from './collections.functions'
import type { CollectionsRepo } from './collections.repo'
import type { ReactNode } from 'react'
import { Ok } from '@/lib/result'

// ---------------------------------------------------------------------------
// collections.functions is mocked at the top level so that importing the
// query hooks never triggers collections.functions' module-scope
// createServerFn() calls.
// ---------------------------------------------------------------------------

vi.mock('./collections.functions', () => ({
  createCollectionFn: vi.fn(),
  renameCollectionFn: vi.fn(),
  setCollectionVisibilityFn: vi.fn(),
  deleteCollectionFn: vi.fn(),
  addCollectionItemFn: vi.fn(),
  addCollectionItemAtPositionFn: vi.fn(),
  removeCollectionItemFn: vi.fn(),
}))

const USER_ID = '550e8400-e29b-41d4-a716-446655440002'
const COLLECTION_ID = '550e8400-e29b-41d4-a716-446655440001'

const ITEM_INPUT = {
  collectionId: COLLECTION_ID,
  assetKey: {
    providerId: 'nasa_ivl',
    externalId: 'ARC-1998-AC98-0418-6',
  },
} as const

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// an ACTIVE owner-cards query (one per key family would be ideal, but the
// public-family reads need heavier repo stubs; the cards query plus direct
// state checks on both families cover the distinction)
function mountActiveCardsQuery(queryClient: QueryClient) {
  const getCollectionCardsForOwner = vi.fn().mockResolvedValue(Ok([]))
  const repo: Pick<CollectionsRepo, 'getCollectionCardsForOwner'> = {
    getCollectionCardsForOwner,
  }
  renderHook(
    () => useQuery(getUserCollectionCardsOptions({ userId: USER_ID, repo })),
    { wrapper: makeWrapper(queryClient) },
  )
  return { getCollectionCardsForOwner, repo }
}

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('collections mutation invalidation', () => {
  it('removal never refetches an active item-edge list but refreshes the rest', async () => {
    const queryClient = new QueryClient()
    const getCollectionItemEdges = vi
      .fn()
      .mockResolvedValue(
        Ok({ items: [], pagination: { next: null, total: 0 } }),
      )
    renderHook(
      () =>
        useInfiniteQuery(
          getInfiniteUserCollectionItemEdgesOptions({
            collectionId: COLLECTION_ID,
            repo: { getCollectionItemEdges },
          }),
        ),
      { wrapper: makeWrapper(queryClient) },
    )
    // the PUBLIC grid too: it can anchor the open picker (a tile vanishing
    // mid-refetch would unmount the popover being toggled)
    const getPublicItemEdges = vi
      .fn()
      .mockResolvedValue(
        Ok({ items: [], pagination: { next: null, total: 0 } }),
      )
    renderHook(
      () =>
        useInfiniteQuery(
          getInfiniteCollectionItemEdgesOptions({
            collectionId: COLLECTION_ID,
            repo: { getCollectionItemEdges: getPublicItemEdges },
          }),
        ),
      { wrapper: makeWrapper(queryClient) },
    )
    const { getCollectionCardsForOwner } = mountActiveCardsQuery(queryClient)
    await waitFor(() => {
      expect(getCollectionItemEdges).toHaveBeenCalledOnce()
      expect(getCollectionCardsForOwner).toHaveBeenCalledOnce()
    })

    vi.mocked(removeCollectionItemFn).mockResolvedValue({ removed: true })
    const { result } = renderHook(() => useRemoveCollectionItem(), {
      wrapper: makeWrapper(queryClient),
    })
    await result.current.mutateAsync(ITEM_INPUT)

    // membership/cards refresh so picker checkboxes reflect the removal...
    await waitFor(() =>
      expect(getCollectionCardsForOwner).toHaveBeenCalledTimes(2),
    )
    // ...while the ghost-bearing edge list is only marked stale
    expect(
      queryClient.getQueryState([
        'me',
        'collections',
        'detail',
        COLLECTION_ID,
        'itemEdges',
      ])?.isInvalidated,
    ).toBe(true)
    expect(getCollectionItemEdges).toHaveBeenCalledOnce()
    expect(
      queryClient.getQueryState([
        'collections',
        'detail',
        COLLECTION_ID,
        'itemEdges',
      ])?.isInvalidated,
    ).toBe(true)
    expect(getPublicItemEdges).toHaveBeenCalledOnce()
  })

  it('settings mutations never refetch an active item-edge list (mounted ghosts)', async () => {
    const queryClient = new QueryClient()
    const getCollectionItemEdges = vi
      .fn()
      .mockResolvedValue(
        Ok({ items: [], pagination: { next: null, total: 0 } }),
      )
    renderHook(
      () =>
        useInfiniteQuery(
          getInfiniteUserCollectionItemEdgesOptions({
            collectionId: COLLECTION_ID,
            repo: { getCollectionItemEdges },
          }),
        ),
      { wrapper: makeWrapper(queryClient) },
    )
    await waitFor(() => expect(getCollectionItemEdges).toHaveBeenCalledOnce())

    vi.mocked(renameCollectionFn).mockResolvedValue({
      id: COLLECTION_ID,
      ownerId: USER_ID,
      name: 'renamed',
      visibility: 'private',
      createdAt: '2026-07-26T00:00:00+00:00',
      updatedAt: '2026-07-26T00:00:00+00:00',
    })
    const { result } = renderHook(() => useRenameCollection(), {
      wrapper: makeWrapper(queryClient),
    })
    await result.current.mutateAsync({
      collectionId: COLLECTION_ID,
      name: 'renamed',
    })

    await waitFor(() => {
      expect(
        queryClient.getQueryState([
          'me',
          'collections',
          'detail',
          COLLECTION_ID,
          'itemEdges',
        ])?.isInvalidated,
      ).toBe(true)
    })
    expect(getCollectionItemEdges).toHaveBeenCalledOnce()
  })

  it('create refetches active queries (the default the other hooks share)', async () => {
    const queryClient = new QueryClient()
    const { getCollectionCardsForOwner } = mountActiveCardsQuery(queryClient)
    await waitFor(() =>
      expect(getCollectionCardsForOwner).toHaveBeenCalledOnce(),
    )

    vi.mocked(createCollectionFn).mockResolvedValue({
      id: COLLECTION_ID,
      ownerId: USER_ID,
      name: 'lunar landscapes',
      visibility: 'private',
      createdAt: '2026-07-26T00:00:00+00:00',
      updatedAt: '2026-07-26T00:00:00+00:00',
    })
    const { result } = renderHook(() => useCreateCollection(), {
      wrapper: makeWrapper(queryClient),
    })
    await result.current.mutateAsync({
      name: 'lunar landscapes',
      visibility: 'private',
    })

    await waitFor(() =>
      expect(getCollectionCardsForOwner).toHaveBeenCalledTimes(2),
    )
  })
})
