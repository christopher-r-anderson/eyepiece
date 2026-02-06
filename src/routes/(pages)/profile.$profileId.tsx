import { createFileRoute } from '@tanstack/react-router'
import { Profile } from '@/features/profiles/components/profile'
import { getProfile } from '@/features/profiles/profile-service'

export const Route = createFileRoute('/(pages)/profile/$profileId')({
  component: ProfilePage,
  loader: async ({ params }) => {
    const { profileId } = params
    const result = await getProfile(profileId)
    if (result.kind === 'error') {
      throw new Response('Profile Not Found', { status: 404 })
    }
    return { profile: result.data }
  },
})

function ProfilePage() {
  const { profile } = Route.useLoaderData()
  return (
    <>
      <h1>Profile</h1>
      <Profile profile={profile} />
    </>
  )
}
