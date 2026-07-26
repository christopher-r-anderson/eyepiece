import {
  createFileRoute,
  useNavigate,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { css } from 'styled-system/css'
import {
  ensureUserCollectionCards,
  useSuspenseUserCollectionCards,
} from '@/features/collections/collections.queries'
import { CollectionCard } from '@/features/collections/components/collection-card'
import { CreateCollectionForm } from '@/features/collections/forms/create-collection-form'
import { Button } from '@/components/ui/button'
import { ModalDialog } from '@/components/ui/modal-dialog'
import { PageHeading } from '@/components/page-heading'
import { RouteError } from '@/app/layout/route-error'
import { createUserSupabaseClient } from '@/integrations/supabase/user'

const CollectionsHeading = () => <PageHeading>Your collections</PageHeading>

export const Route = createFileRoute('/(private)/(pages)/collections/')({
  component: CollectionsPage,
  loader: async ({ context }) => {
    // Isomorphic: per-request server client on SSR, browser singleton on SPA
    // navigations. Auth is already enforced by the (private) boundary.
    await ensureUserCollectionCards({
      userId: context.user.id,
      queryClient: context.queryClient,
      userSupabaseClient: createUserSupabaseClient(),
    })
  },
  errorComponent: ({ error }) => (
    <RouteError
      error={error}
      heading={<CollectionsHeading />}
      message="Error loading collections."
    />
  ),
  pendingComponent: () => <CollectionsHeading />,
})

const NEW_COLLECTION_HASH = 'new'

function CollectionsPage() {
  const { user } = Route.useRouteContext()
  const cards = useSuspenseUserCollectionCards(user.id)
  const navigate = useNavigate()
  const router = useRouter()

  const isCreateOpen = useRouterState({
    select: (s) => s.location.hash === NEW_COLLECTION_HASH,
  })
  const openedByPush = useRouterState({
    select: (s) => !!s.location.state.dialogPushed,
  })

  const openCreate = () =>
    navigate({
      hash: NEW_COLLECTION_HASH,
      replace: false,
      viewTransition: false,
      state: (prev) => ({ ...prev, dialogPushed: true }),
    })
  const closeCreate = () => {
    if (openedByPush) {
      router.history.back()
      return
    }
    navigate({ hash: '', replace: true, viewTransition: false })
  }

  return (
    <>
      <div
        className={css({
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '4',
          flexWrap: 'wrap',
        })}
      >
        <CollectionsHeading />
        <Button variant="primary" onPress={openCreate}>
          New collection
        </Button>
      </div>
      {cards.length === 0 ? (
        <p className={css({ marginTop: '4', color: 'text.muted' })}>
          No collections yet. Create one to start gathering pics.
        </p>
      ) : (
        <ul
          // Safari drops list semantics with list-style: none
          role="list"
          className={css({
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '5',
            marginTop: '6',
            mdDown: { gridTemplateColumns: '1fr' },
            listStyle: 'none',
            paddingInlineStart: '0',
          })}
        >
          {cards.map((card) => (
            <li key={card.collection.id} className={css({ minWidth: 0 })}>
              <CollectionCard
                card={card}
                showVisibility
                isLinked={card.collection.visibility === 'public'}
                titleLevel={2}
              />
            </li>
          ))}
        </ul>
      )}
      <ModalDialog
        isOpen={isCreateOpen}
        onOpenChange={(shouldOpen) =>
          shouldOpen ? openCreate() : closeCreate()
        }
        title="New collection"
        isDismissable
      >
        <CreateCollectionForm onSuccess={closeCreate} />
      </ModalDialog>
    </>
  )
}
