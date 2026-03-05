import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Profile } from '@/features/profiles/components/profile'
import { makeProfilesRepo } from '@/features/profiles/profiles.repo'
import { createPublicSupabaseClient } from '@/integrations/supabase/public'
import { getProfileOptions } from '@/features/profiles/profiles.queries'

export const Route = createFileRoute('/(pages)/profile/$profileId')({
  component: ProfilePage,
  loader: async ({ context, params }) => {
    const { profileId } = params
    const repo = makeProfilesRepo(createPublicSupabaseClient())
    const profile = await context.queryClient.ensureQueryData(
      getProfileOptions({ repo, id: profileId }),
    )
    if (!profile) {
      notFound()
    }
  },
  notFoundComponent: () => (
    <>
      <h1>Profile Not Found</h1>
      <p>We couldn't find a user with that ID.</p>
    </>
  ),
})

function ProfilePage() {
  const { profileId } = Route.useParams()
  const repo = makeProfilesRepo(createPublicSupabaseClient())
  const { data: profile } = useSuspenseQuery(
    getProfileOptions({ repo, id: profileId }),
  )
  if (!profile) {
    throw notFound()
  }
  return (
    <>
      <h1>Profile</h1>
      <Profile profile={profile} />
    </>
  )
}
