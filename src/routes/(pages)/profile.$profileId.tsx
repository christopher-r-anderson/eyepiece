import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageHeading } from '../-components/page-heading'
import { Profile } from '@/features/profiles/components/profile'
import {
  ensureProfile,
  useSuspenseProfile,
} from '@/features/profiles/profiles.queries'

export const Route = createFileRoute('/(pages)/profile/$profileId')({
  component: ProfilePage,
  loader: async ({
    context: { queryClient, publicSupabaseClient },
    params: { profileId },
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
  const { profileId } = Route.useParams()
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
