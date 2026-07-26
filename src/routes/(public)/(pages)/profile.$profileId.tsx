import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageHeading } from '../../-components/page-heading'
import { Profile } from '@/features/profiles/components/profile'
import {
  ensureProfile,
  useSuspenseProfile,
} from '@/features/profiles/profiles.queries'
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
    <>
      <PageHeading>Profile Not Found</PageHeading>
      <p>We couldn't find a user with that ID.</p>
    </>
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
    </>
  )
}
