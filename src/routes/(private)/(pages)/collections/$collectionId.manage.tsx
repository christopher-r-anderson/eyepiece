import {
  createFileRoute,
  notFound,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { startTransition, useCallback, useMemo, useState } from 'react'
import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { useViewingAssetTileLinkProps } from '../../../(public)/(pages)/-components/asset-viewing-overlay'
import type {
  AssetKey,
  AssetPreviewSnapshot,
} from '@/domain/asset/asset.schema'
import type { CollectionItemEdge } from '@/features/collections/collections.schema'
import {
  ensureInfiniteUserCollectionItemEdges,
  ensureUserCollection,
  useAddCollectionItemAtPosition,
  useDeleteCollection,
  useRemoveCollectionItem,
  useSetCollectionVisibility,
  useSuspenseInfiniteUserCollectionItemEdges,
  useSuspenseUserCollection,
} from '@/features/collections/collections.queries'
import { collectionIdSchema } from '@/features/collections/collections.schema'
import { RenameCollectionForm } from '@/features/collections/forms/rename-collection-form'
import {
  ensureAssetPreviewSnapshotsBatch,
  useAssetPreviewSnapshotsBatch,
} from '@/features/assets/asset-preview-snapshots.queries'
import { JustifiedAssetGrid } from '@/features/assets/components/justified-asset-grid'
import { AssetGridSkeleton } from '@/features/assets/components/asset-grid-skeleton'
import { InfiniteLoader } from '@/components/infinite-loader/infinite-loader'
import { PageHeader } from '@/components/page-header'
import { NotFound } from '@/components/errors/not-found'
import { Button } from '@/components/ui/button'
import { ModalDialog } from '@/components/ui/modal-dialog'
import { Switch } from '@/components/ui/switch'
import { ToggleButton } from '@/components/ui/toggle-button'
import { FormActions } from '@/components/ui/forms'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { RouteError } from '@/app/layout/route-error'
import { createUserSupabaseClient } from '@/integrations/supabase/user'
import {
  GhostRemovedActions,
  refocusTileControlAfterSwap,
  useGhostRemovals,
} from '@/features/assets/components/ghost-removals'
import { toAssetKeyString } from '@/domain/asset/asset.utils'
import { getTitleText } from '@/lib/utils'

const ManageHeading = () => <PageHeader title="Manage collection" />

export const Route = createFileRoute(
  '/(private)/(pages)/collections/$collectionId/manage',
)({
  component: ManageCollectionPage,
  beforeLoad: ({ params }) => {
    const collectionId = collectionIdSchema.safeParse(params.collectionId)
    if (!collectionId.success) {
      throw notFound()
    }
    return { collectionId: collectionId.data }
  },
  loader: async ({ context }) => {
    const userSupabaseClient = createUserSupabaseClient()
    const collection = await ensureUserCollection({
      collectionId: context.collectionId,
      queryClient: context.queryClient,
      userSupabaseClient,
    })
    // the user client reads own-or-public rows, so another owner's public
    // collection resolves; managing stays owner-only
    if (!collection || collection.ownerId !== context.user.id) {
      throw notFound()
    }
    const edges = await ensureInfiniteUserCollectionItemEdges({
      collectionId: context.collectionId,
      queryClient: context.queryClient,
      userSupabaseClient,
    })
    await ensureAssetPreviewSnapshotsBatch({
      assetPreviewSnapshotIds: edges.pages.flatMap((page) =>
        page.items.map((edge) => edge.assetPreviewSnapshotId),
      ),
      queryClient: context.queryClient,
      publicSupabaseClient: context.publicSupabaseClient,
    })
    return { collectionName: collection.name }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: getTitleText(loaderData?.collectionName) }],
  }),
  notFoundComponent: () => (
    <NotFound
      title="Collection not found"
      message="This collection doesn't exist, or you don't manage it."
    />
  ),
  errorComponent: ({ error }) => (
    <RouteError
      error={error}
      heading={<ManageHeading />}
      message="Error loading the collection."
      captureContext={{
        boundaryKind: 'route',
        feature: 'collections',
        operation: 'load_collection_manage',
      }}
    />
  ),
  pendingComponent: () => (
    <>
      <ManageHeading />
      <AssetGridSkeleton />
    </>
  ),
})

const sectionCss = css({ marginTop: '6', maxWidth: 'formMax' })

function ManageCollectionPage() {
  const { collectionId } = Route.useRouteContext()
  const collection = useSuspenseUserCollection(collectionId)
  const queueToastMessage = useQueueToastMessage()
  const navigate = useNavigate()
  const router = useRouter()
  const setVisibility = useSetCollectionVisibility()
  const deleteCollection = useDeleteCollection()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  if (!collection) {
    // deleted from under an open page; the loader owns the first-load 404
    throw notFound()
  }

  return (
    <>
      <PageHeader title={collection.name} />
      <section aria-label="Collection settings" className={sectionCss}>
        <RenameCollectionForm
          collection={collection}
          // the document title comes from the loader; invalidating reruns
          // it so the tab reflects the new name
          onSuccess={() => void router.invalidate()}
        />
        <div className={css({ marginTop: '4', padding: '0 4' })}>
          <Switch
            isSelected={collection.visibility === 'public'}
            onChange={(isSelected) => {
              if (setVisibility.isPending) {
                return
              }
              setVisibility.mutate(
                {
                  collectionId: collection.id,
                  visibility: isSelected ? 'public' : 'private',
                },
                {
                  onError: () =>
                    queueToastMessage({
                      title: 'Visibility change failed',
                      description: 'Please try again.',
                    }),
                },
              )
            }}
          >
            Public collection
          </Switch>
        </div>
        <div className={css({ marginTop: '4', padding: '0 4' })}>
          <Button variant="secondary" onPress={() => setIsDeleteOpen(true)}>
            Delete collection
          </Button>
        </div>
      </section>
      {/* param-only navigation reuses this component instance; the key
          resets ghost and per-item operation state per collection */}
      <CollectionItems key={collectionId} collectionId={collectionId} />
      <ModalDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete collection"
        isDismissable
      >
        <p>
          Permanently delete &ldquo;{collection.name}&rdquo;? This can&apos;t be
          undone.
        </p>
        <FormActions className={css({ marginTop: '4' })}>
          <Button variant="secondary" onPress={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            isPending={deleteCollection.isPending}
            onPress={() => {
              if (deleteCollection.isPending) {
                return
              }
              deleteCollection.mutate(
                { collectionId: collection.id },
                {
                  onSuccess: () => {
                    void navigate({ to: '/collections' })
                  },
                  onError: () => {
                    setIsDeleteOpen(false)
                    queueToastMessage({
                      title: 'Delete failed',
                      description: 'Please try again.',
                    })
                  },
                },
              )
            }}
          >
            Delete
          </Button>
        </FormActions>
      </ModalDialog>
    </>
  )
}

function CollectionItems({ collectionId }: { collectionId: string }) {
  const tileLinkProps = useViewingAssetTileLinkProps()
  const edgesResult = useSuspenseInfiniteUserCollectionItemEdges(collectionId)
  const snapshotsResult = useAssetPreviewSnapshotsBatch(
    edgesResult.data.edges.map((edge) => edge.assetPreviewSnapshotId),
  )
  // mutateAsync alone: the mutation result object is fresh every render
  // and would defeat the grid rows' memo through the tile-actions identity
  const { mutateAsync: removeItemAsync } = useRemoveCollectionItem()
  const { mutateAsync: reAddItemAsync } = useAddCollectionItemAtPosition()
  const queueToastMessage = useQueueToastMessage()
  const [isEditing, setIsEditing] = useState(false)
  const {
    removedIds,
    runRemoval,
    runRestore,
    tileClassName,
    tileLinkDisabled,
  } = useGhostRemovals()
  const makeOpFailureHandler = useCallback(
    (title: string, assetKey: AssetKey) => () => {
      refocusTileControlAfterSwap(toAssetKeyString(assetKey))
      queueToastMessage({ title, description: 'Please try again.' })
    },
    [queueToastMessage],
  )

  if (edgesResult.isError) {
    throw edgesResult.error
  }
  if (snapshotsResult.isError) {
    throw snapshotsResult.error
  }

  const edgesBySnapshotId = useMemo(() => {
    const map = new Map<string, CollectionItemEdge>()
    for (const edge of edgesResult.data.edges) {
      map.set(edge.assetPreviewSnapshotId, edge)
    }
    return map
  }, [edgesResult.data.edges])

  const tilePersistentActions = useCallback(
    (item: AssetPreviewSnapshot) => {
      const edge = edgesBySnapshotId.get(item.id)
      if (!edge) {
        return undefined
      }
      if (removedIds.has(item.id)) {
        return (
          <GhostRemovedActions
            onUndo={() => {
              refocusTileControlAfterSwap(toAssetKeyString(edge.assetKey))
              runRestore(
                item.id,
                () =>
                  reAddItemAsync({
                    collectionId,
                    assetKey: edge.assetKey,
                    position: edge.position,
                    createdAt: edge.createdAt,
                  }),
                makeOpFailureHandler('Undo failed', edge.assetKey),
              )
            }}
          />
        )
      }
      if (!isEditing) {
        return undefined
      }
      return (
        <Button
          variant="icon"
          css={css.raw({ color: 'inherit', _hovered: { color: 'inherit' } })}
          aria-label={`Remove ${item.title}`}
          onPress={() => {
            refocusTileControlAfterSwap(toAssetKeyString(edge.assetKey))
            runRemoval(
              item.id,
              () => removeItemAsync({ collectionId, assetKey: edge.assetKey }),
              makeOpFailureHandler('Remove failed', edge.assetKey),
            )
          }}
        >
          <XIcon size={20} weight="bold" />
        </Button>
      )
    },
    [
      edgesBySnapshotId,
      removedIds,
      isEditing,
      collectionId,
      runRemoval,
      runRestore,
      removeItemAsync,
      reAddItemAsync,
      makeOpFailureHandler,
    ],
  )

  if (edgesResult.data.total === 0) {
    return (
      <p className={css({ marginTop: '6' })}>
        This collection is empty. Add pics from search results or asset pages.
      </p>
    )
  }

  return (
    <section aria-label="Collection items" className={css({ marginTop: '6' })}>
      <ToggleButton
        isSelected={isEditing}
        onChange={setIsEditing}
        aria-label="Edit items"
      >
        {isEditing ? 'Done editing' : 'Edit items'}
      </ToggleButton>
      <InfiniteLoader
        isFetchingNextPage={
          edgesResult.isFetchingNextPage || snapshotsResult.isFetching
        }
        fetchNextPage={() => {
          startTransition(async () => {
            await edgesResult.fetchNextPage()
          })
        }}
        hasNextPage={edgesResult.hasNextPage}
        loadedCount={snapshotsResult.data?.length ?? 0}
        uiResetKey={collectionId}
        className={css({ width: '100%', marginTop: '4' })}
      >
        <JustifiedAssetGrid
          startsInViewport
          tileLinkProps={tileLinkProps}
          aria-label="Collection items"
          items={snapshotsResult.data ?? []}
          tilePersistentActions={tilePersistentActions}
          tileClassName={tileClassName}
          tileLinkDisabled={tileLinkDisabled}
        />
      </InfiniteLoader>
    </section>
  )
}
