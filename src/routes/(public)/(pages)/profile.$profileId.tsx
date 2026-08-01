import { Suspense } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { PageHeading } from '@/components/page-heading'
import { NotFound } from '@/components/errors/not-found'
import { Heading } from '@/components/ui/heading'
import { Profile } from '@/features/profiles/components/profile'
import {
  ensureProfile,
  useSuspenseProfile,
} from '@/features/profiles/profiles.queries'
import {
  prefetchPublicCollectionCards,
  useSuspensePublicCollectionCards,
} from '@/features/collections/collections.queries'
import {
  CollectionCardGrid,
  CollectionCardGridSkeleton,
} from '@/features/collections/components/collection-card-grid'
import { CapturedCatchBoundary } from '@/components/errors/captured-errors'
import { profileSchema } from '@/domain/profile/profile.schema'

export const Route = createFileRoute('/(public)/(pages)/profile/$profileId')({
  component: ProfilePage,
  beforeLoad: ({ params }) => {
    const profileId = profileSchema.shape.id.safeParse(params.profileId)
    if (!profileId.success) {
      throw notFound()
    }
    return { profileId: profileId.data }
  },
  loader: async ({
    context: { queryClient, publicSupabaseClient, profileId },
  }) => {
    // not awaited: the section streams and settles into its own boundary
    void prefetchPublicCollectionCards({
      ownerId: profileId,
      queryClient,
      publicSupabaseClient,
    })
    const profile = await ensureProfile({
      id: profileId,
      queryClient: queryClient,
      publicSupabaseClient: publicSupabaseClient,
    })
    if (!profile) {
      throw notFound()
    }
  },
  notFoundComponent: () => (
    <NotFound
      title="Profile not found"
      message="We couldn't find a user with that ID."
    />
  ),
})

function ProfilePage() {
  const { profileId } = Route.useRouteContext()
  const profile = useSuspenseProfile(profileId)
  if (!profile) {
    throw notFound()
  }
  return (
    <>
      <PageHeading>Profile</PageHeading>
      <Profile profile={profile} />
      <div className={css({ marginTop: 'sectionGap' })}>
        <PublicCollectionsSection profileId={profileId} />
      </div>
    </>
  )
}

function PublicCollectionsSection({ profileId }: { profileId: string }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId}>
      <Heading
        level={2}
        id={headingId}
        css={css.raw({ textStyle: 'title.md', marginBottom: '4' })}
      >
        Public collections
      </Heading>
      <CapturedCatchBoundary
        resetKey={hashKey(['profile-collections', profileId])}
        message="Couldn't load collections right now."
        captureContext={{
          boundaryKind: 'catch',
          feature: 'profiles',
          operation: 'load_collection_cards',
        }}
      >
        <Suspense fallback={<CollectionCardGridSkeleton />}>
          <ProfileCollectionCards profileId={profileId} />
        </Suspense>
      </CapturedCatchBoundary>
    </section>
  )
}

function ProfileCollectionCards({ profileId }: { profileId: string }) {
  const cards = useSuspensePublicCollectionCards(profileId)
  return <CollectionCardGrid cards={cards} />
}
