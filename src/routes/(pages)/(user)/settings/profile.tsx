import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { UpsertProfileForm } from '@/features/profiles/forms/upsert-profile-form'
import { getUser } from '@/features/auth/get-user'
import { makeProfilesRepo } from '@/features/profiles/profiles.repo'
import { resultIsError } from '@/lib/result'
import { makeProfilesCommands } from '@/features/profiles/profiles.commands'

export const Route = createFileRoute('/(pages)/(user)/settings/profile')({
  component: ProfilePage,
  loader: async ({ context }) => {
    const user = await getUser()
    if (!user) {
      throw new Error('User not found in complete-profile loader')
    }
    const repo = makeProfilesRepo(context.publicSupabaseClient)
    const profileResult = await repo.getProfile(user.id)
    if (resultIsError(profileResult)) {
      return { userId: user.id }
    } else {
      return { userId: user.id, profile: profileResult.data }
    }
  },
})

function ProfilePage() {
  const { userId, profile } = Route.useLoaderData()
  const { userSupabaseClient: supabaseUserClient } = Route.useRouteContext()
  const commands = makeProfilesCommands(supabaseUserClient)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    if (!showSuccessMessage) return
    const timer = setTimeout(() => setShowSuccessMessage(false), 5000)
    return () => clearTimeout(timer)
  }, [showSuccessMessage])

  return (
    <>
      <UpsertProfileForm
        initialData={profile ?? { id: userId }}
        onSuccess={() => setShowSuccessMessage(true)}
        headingLevel={1}
        profileCommands={commands}
      />
      {showSuccessMessage && <p>Profile Updated.</p>}
    </>
  )
}
