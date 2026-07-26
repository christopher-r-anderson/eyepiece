import {
  createFileRoute,
  notFound,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { startTransition, useCallback, useMemo, useRef, useState } from 'react'
import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import type { AssetPreviewSnapshot } from '@/domain/asset/asset.schema'
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
import { PageHeading } from '@/components/page-heading'
import { Button } from '@/components/ui/button'
import { ModalDialog } from '@/components/ui/modal-dialog'
import { Switch } from '@/components/ui/switch'
import { ToggleButton } from '@/components/ui/toggle-button'
import { FormActions } from '@/components/ui/forms'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { RouteError } from '@/app/layout/route-error'
import { createUserSupabaseClient } from '@/integrations/supabase/user'
import { getTitleText } from '@/lib/utils'

const ManageHeading = () => <PageHeading>Manage collection</PageHeading>

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
    <>
      <PageHeading>Collection Not Found</PageHeading>
      <p>This collection doesn&apos;t exist, or you don&apos;t manage it.</p>
    </>
  ),
  errorComponent: ({ error }) => (
    <RouteError
      error={error}
      heading={<ManageHeading />}
      message="Error loading the collection."
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
      <PageHeading>{collection.name}</PageHeading>
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

// ghost rows: the removed tile keeps its slot dimmed with an always-visible
// veil so justified rows never re-break and undo stays in place
const ghostTileCss = css({
  '& [data-tile-primary-link]': { pointerEvents: 'none' },
  '& img': { opacity: 0.3 },
  '& [data-tile-reveal], & [data-tile-controls]': {
    opacity: 1,
    translate: 'none',
  },
  // the veil only enables its controls while hover-revealed; a ghost's undo
  // must stay clickable without hover (coarse pointers, keyboard-then-mouse)
  '& [data-tile-controls]': { pointerEvents: 'auto' },
})

function CollectionItems({ collectionId }: { collectionId: string }) {
  const edgesResult = useSuspenseInfiniteUserCollectionItemEdges(collectionId)
  const snapshotsResult = useAssetPreviewSnapshotsBatch(
    edgesResult.data.edges.map((edge) => edge.assetPreviewSnapshotId),
  )
  const removeItem = useRemoveCollectionItem()
  const reAddItem = useAddCollectionItemAtPosition()
  const queueToastMessage = useQueueToastMessage()
  const [isEditing, setIsEditing] = useState(false)
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
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

  const tileClassName = useCallback(
    (item: AssetPreviewSnapshot) =>
      removedIds.has(item.id) ? ghostTileCss : undefined,
    [removedIds],
  )

  const tileLinkDisabled = useCallback(
    (item: AssetPreviewSnapshot) => removedIds.has(item.id),
    [removedIds],
  )

  // one operation chain per item: mutateAsync (per-call mutate callbacks
  // can be dropped under rapid calls on one observer), and each remove or
  // undo queues behind the item's previous operation - otherwise a quick
  // undo races the in-flight delete, or a re-removal races the undo's
  // insert, and the server ends up opposite the UI
  const pendingOpsRef = useRef(new Map<string, Promise<void>>())
  // a failed operation may no longer reflect what the user last asked for
  // (remove -> undo -> remove again while the first is in flight): rollback
  // and toast only when the failure belongs to the item's latest intent
  const intentRef = useRef(new Map<string, number>())
  const nextIntent = useCallback((id: string) => {
    const token = (intentRef.current.get(id) ?? 0) + 1
    intentRef.current.set(id, token)
    return token
  }, [])
  const enqueueItemOp = useCallback(
    (id: string, operation: () => Promise<void>) => {
      const prior = pendingOpsRef.current.get(id) ?? Promise.resolve()
      // operations handle their own failures, so the chain never rejects
      const next = prior.then(operation)
      pendingOpsRef.current.set(id, next)
    },
    [],
  )

  const tileActions = useCallback(
    (item: AssetPreviewSnapshot) => {
      const edge = edgesBySnapshotId.get(item.id)
      if (!edge) {
        return undefined
      }
      if (removedIds.has(item.id)) {
        return (
          <span
            className={css({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2',
            })}
          >
            Removed
            <Button
              variant="bare"
              className={css({ textDecoration: 'underline' })}
              onPress={() => {
                setRemovedIds((prev) => {
                  const next = new Set(prev)
                  next.delete(item.id)
                  return next
                })
                const token = nextIntent(item.id)
                enqueueItemOp(item.id, () =>
                  reAddItem
                    .mutateAsync({
                      collectionId,
                      assetKey: edge.assetKey,
                      position: edge.position,
                      createdAt: edge.createdAt,
                    })
                    .then(
                      () => undefined,
                      () => {
                        if (intentRef.current.get(item.id) !== token) {
                          return
                        }
                        setRemovedIds((prev) => new Set(prev).add(item.id))
                        queueToastMessage({
                          title: 'Undo failed',
                          description: 'Please try again.',
                        })
                      },
                    ),
                )
              }}
            >
              Undo
            </Button>
          </span>
        )
      }
      if (!isEditing) {
        return undefined
      }
      return (
        <Button
          variant="bare"
          aria-label={`Remove ${item.title}`}
          onPress={() => {
            setRemovedIds((prev) => new Set(prev).add(item.id))
            const token = nextIntent(item.id)
            enqueueItemOp(item.id, () =>
              removeItem
                .mutateAsync({ collectionId, assetKey: edge.assetKey })
                .then(
                  () => undefined,
                  () => {
                    if (intentRef.current.get(item.id) !== token) {
                      return
                    }
                    setRemovedIds((prev) => {
                      const next = new Set(prev)
                      next.delete(item.id)
                      return next
                    })
                    queueToastMessage({
                      title: 'Remove failed',
                      description: 'Please try again.',
                    })
                  },
                ),
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
      removeItem,
      reAddItem,
      queueToastMessage,
      enqueueItemOp,
      nextIntent,
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
          aria-label="Collection items"
          items={snapshotsResult.data ?? []}
          tileActions={tileActions}
          tileClassName={tileClassName}
          tileLinkDisabled={tileLinkDisabled}
        />
      </InfiniteLoader>
    </section>
  )
}
