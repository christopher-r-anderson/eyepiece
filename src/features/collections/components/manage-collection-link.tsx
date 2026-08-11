import { ClientOnly } from '@tanstack/react-router'
import type { Collection } from '../collections.schema'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import { Link } from '@/components/ui/link'

// post-hydration owner island: the public page's SSR output must stay
// viewer-independent, so the manage link only ever renders client-side
export function ManageCollectionLink({
  collection,
}: {
  collection: Collection
}) {
  return (
    <ClientOnly fallback={null}>
      <ManageCollectionLinkContent collection={collection} />
    </ClientOnly>
  )
}

function ManageCollectionLinkContent({
  collection,
}: {
  collection: Collection
}) {
  const { data: user } = useCurrentUserQuery()
  if (!user || user.id !== collection.ownerId) {
    return null
  }
  return (
    <Link
      to="/collections/$collectionId/manage"
      params={{ collectionId: collection.id }}
      css={{
        textStyle: 'meta',
        textTransform: 'lowercase',
        // sits inline in muted meta text: color alone can't mark it as a link
        textDecoration: 'underline',
      }}
    >
      manage
    </Link>
  )
}
