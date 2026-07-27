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
  getAssetCollectionMembershipOptions,
  getInfiniteCollectionItemEdgesOptions,
  getInfiniteUserCollectionItemEdgesOptions,
  getPublicCollectionCardsOptions,
  getUserCollectionCardsOptions,
  getUserCollectionsListOptions,
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
import type { AssetKey } from '@/domain/asset/asset.schema'
import { Ok } from '@/lib/result'

const { USER_ID } = vi.hoisted(() => ({
  USER_ID: '550e8400-e29b-41d4-a716-446655440002',
}))

// ---------------------------------------------------------------------------
// collections.functions is mocked at the top level so that importing the
// query hooks never triggers collections.functions' module-scope
// createServerFn() calls. auth.queries is stubbed so the owner-scoped
// invalidators see a signed-in user.
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

vi.mock('@/features/auth/auth.queries', () => ({
  useCurrentUserQuery: () => ({ data: { id: USER_ID } }),
}))

const OTHER_OWNER_ID = '550e8400-e29b-41d4-a716-4466554400ff'
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

function mountActiveListQuery(queryClient: QueryClient) {
  const getUserCollections = vi.fn().mockResolvedValue(Ok([]))
  renderHook(
    () =>
      useQuery(
        getUserCollectionsListOptions({
          userId: USER_ID,
          repo: { getUserCollections },
        }),
      ),
    { wrapper: makeWrapper(queryClient) },
  )
  return { getUserCollections }
}

function mountActiveMembershipQuery(
  queryClient: QueryClient,
  assetKey: AssetKey = ITEM_INPUT.assetKey,
) {
  const getCollectionIdsForAsset = vi.fn().mockResolvedValue(Ok([]))
  renderHook(
    () =>
      useQuery(
        getAssetCollectionMembershipOptions({
          userId: USER_ID,
          assetKey,
          repo: { getCollectionIdsForAsset },
        }),
      ),
    { wrapper: makeWrapper(queryClient) },
  )
  return { getCollectionIdsForAsset }
}

const OTHER_ASSET_KEY = {
  providerId: 'nasa_ivl',
  externalId: 'a-different-asset',
} as const

function mountActivePublicCardsQuery(
  queryClient: QueryClient,
  ownerId: string,
) {
  const getPublicCollectionCardsForOwner = vi.fn().mockResolvedValue(Ok([]))
  renderHook(
    () =>
      useQuery(
        getPublicCollectionCardsOptions({
          ownerId,
          repo: { getPublicCollectionCardsForOwner },
        }),
      ),
    { wrapper: makeWrapper(queryClient) },
  )
  return { getPublicCollectionCardsForOwner }
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
    const { getCollectionIdsForAsset } = mountActiveMembershipQuery(queryClient)
    // another asset's picker membership must be untouched: removing this
    // asset's item cannot change which collections contain a different one
    const { getCollectionIdsForAsset: getOtherAssetMembership } =
      mountActiveMembershipQuery(queryClient, OTHER_ASSET_KEY)
    // the picker's collection list can only change on create/rename/delete,
    // never an item toggle - so it must not be refetched (nor awaited)
    const { getUserCollections } = mountActiveListQuery(queryClient)
    // public cards are owner-scoped: the acting owner's refresh, another
    // owner's (the homepage showcase, a visited profile) must not
    const { getPublicCollectionCardsForOwner: getOwnPublicCards } =
      mountActivePublicCardsQuery(queryClient, USER_ID)
    const { getPublicCollectionCardsForOwner: getOtherOwnerPublicCards } =
      mountActivePublicCardsQuery(queryClient, OTHER_OWNER_ID)
    await waitFor(() => {
      expect(getCollectionItemEdges).toHaveBeenCalledOnce()
      expect(getCollectionCardsForOwner).toHaveBeenCalledOnce()
      expect(getCollectionIdsForAsset).toHaveBeenCalledOnce()
      expect(getOtherAssetMembership).toHaveBeenCalledOnce()
      expect(getUserCollections).toHaveBeenCalledOnce()
      expect(getOwnPublicCards).toHaveBeenCalledOnce()
      expect(getOtherOwnerPublicCards).toHaveBeenCalledOnce()
    })

    vi.mocked(removeCollectionItemFn).mockResolvedValue({ removed: true })
    const { result } = renderHook(() => useRemoveCollectionItem(), {
      wrapper: makeWrapper(queryClient),
    })
    await result.current.mutateAsync(ITEM_INPUT)

    // membership/cards refresh so picker checkboxes reflect the removal...
    await waitFor(() => {
      expect(getCollectionCardsForOwner).toHaveBeenCalledTimes(2)
      expect(getCollectionIdsForAsset).toHaveBeenCalledTimes(2)
    })
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
    // the list is neither refetched nor even marked stale
    expect(getUserCollections).toHaveBeenCalledOnce()
    expect(
      queryClient.getQueryState(['me', 'collections', 'list', USER_ID])
        ?.isInvalidated,
    ).toBe(false)
    // ...and neither is the other asset's membership
    expect(getOtherAssetMembership).toHaveBeenCalledOnce()
    expect(
      queryClient.getQueryState([
        'me',
        'collections',
        'membership',
        USER_ID,
        `${OTHER_ASSET_KEY.providerId}-${OTHER_ASSET_KEY.externalId}`,
      ])?.isInvalidated,
    ).toBe(false)
    // the acting owner's public cards refresh; another owner's stay put
    expect(getOwnPublicCards).toHaveBeenCalledTimes(2)
    expect(getOtherOwnerPublicCards).toHaveBeenCalledOnce()
    expect(
      queryClient.getQueryState(['collections', 'publicCards', OTHER_OWNER_ID])
        ?.isInvalidated,
    ).toBe(false)
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

  it('a private create refreshes the list and cards but no membership or public cards', async () => {
    const queryClient = new QueryClient()
    const { getCollectionCardsForOwner } = mountActiveCardsQuery(queryClient)
    const { getUserCollections } = mountActiveListQuery(queryClient)
    const { getCollectionIdsForAsset } = mountActiveMembershipQuery(queryClient)
    const { getPublicCollectionCardsForOwner: getOwnPublicCards } =
      mountActivePublicCardsQuery(queryClient, USER_ID)
    await waitFor(() => {
      expect(getCollectionCardsForOwner).toHaveBeenCalledOnce()
      expect(getUserCollections).toHaveBeenCalledOnce()
      expect(getCollectionIdsForAsset).toHaveBeenCalledOnce()
      expect(getOwnPublicCards).toHaveBeenCalledOnce()
    })

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

    // the new empty row surfaces in the list and cards...
    await waitFor(() => {
      expect(getCollectionCardsForOwner).toHaveBeenCalledTimes(2)
      expect(getUserCollections).toHaveBeenCalledTimes(2)
    })
    // ...but no asset's membership can have changed, and a private
    // collection appears in no public-card query at all
    expect(getCollectionIdsForAsset).toHaveBeenCalledOnce()
    expect(getOwnPublicCards).toHaveBeenCalledOnce()
    expect(
      queryClient.getQueryState(['collections', 'publicCards', USER_ID])
        ?.isInvalidated,
    ).toBe(false)
  })

  it('a public create refreshes only the creator public cards', async () => {
    const queryClient = new QueryClient()
    const { getPublicCollectionCardsForOwner: getOwnPublicCards } =
      mountActivePublicCardsQuery(queryClient, USER_ID)
    const { getPublicCollectionCardsForOwner: getOtherOwnerPublicCards } =
      mountActivePublicCardsQuery(queryClient, OTHER_OWNER_ID)
    await waitFor(() => {
      expect(getOwnPublicCards).toHaveBeenCalledOnce()
      expect(getOtherOwnerPublicCards).toHaveBeenCalledOnce()
    })

    vi.mocked(createCollectionFn).mockResolvedValue({
      id: COLLECTION_ID,
      ownerId: USER_ID,
      name: 'lunar landscapes',
      visibility: 'public',
      createdAt: '2026-07-26T00:00:00+00:00',
      updatedAt: '2026-07-26T00:00:00+00:00',
    })
    const { result } = renderHook(() => useCreateCollection(), {
      wrapper: makeWrapper(queryClient),
    })
    await result.current.mutateAsync({
      name: 'lunar landscapes',
      visibility: 'public',
    })

    await waitFor(() => expect(getOwnPublicCards).toHaveBeenCalledTimes(2))
    // another owner's public cards cannot change from this create
    expect(getOtherOwnerPublicCards).toHaveBeenCalledOnce()
    expect(
      queryClient.getQueryState(['collections', 'publicCards', OTHER_OWNER_ID])
        ?.isInvalidated,
    ).toBe(false)
  })
})
