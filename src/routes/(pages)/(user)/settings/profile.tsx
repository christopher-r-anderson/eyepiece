import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Profile } from '@/domain/profile/profile.schema'
import { UpsertProfileForm } from '@/features/profiles/forms/upsert-profile-form'
import { ensureProfile } from '@/features/profiles/profiles.queries'

type MaybeProfile = Partial<Profile> & Pick<Profile, 'id'>

type ProfilePageData = {
  maybeProfile: MaybeProfile
}

export const Route = createFileRoute('/(pages)/(user)/settings/profile')({
  component: ProfilePage,
  loader: async (args): Promise<ProfilePageData> => {
    const profile = await ensureProfile({
      id: args.context.user.id,
      queryClient: args.context.queryClient,
      publicSupabaseClient: args.context.publicSupabaseClient,
    })
    return {
      maybeProfile: profile ?? { id: args.context.user.id },
    }
  },
})

function ProfilePage() {
  const { maybeProfile } = Route.useLoaderData()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  useEffect(() => {
    if (!showSuccessMessage) return
    const timer = setTimeout(() => setShowSuccessMessage(false), 5000)
    return () => clearTimeout(timer)
  }, [showSuccessMessage])
  return (
    <>
      <UpsertProfileForm
        actionType="update"
        initialData={maybeProfile}
        onSuccess={() => setShowSuccessMessage(true)}
        headingLevel={1}
      />
      {showSuccessMessage && (
        <p css={{ marginTop: 'var(--space-4)' }}>Profile Updated.</p>
      )}
    </>
  )
}
