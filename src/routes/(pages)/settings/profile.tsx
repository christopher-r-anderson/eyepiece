import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { UpsertProfileForm } from '@/features/profiles/forms/upsert-profile-form'
import { getUser } from '@/lib/supabase/user'
import { getProfile } from '@/features/profiles/profile-service'
import { resultIsError } from '@/lib/result'

export const Route = createFileRoute('/(pages)/settings/profile')({
  component: ProfilePage,
  loader: async () => {
    const user = await getUser()
    if (!user) {
      throw new Error('User not found in complete-profile loader')
    }
    const profileResult = await getProfile(user.id)
    if (resultIsError(profileResult)) {
      return { userId: user.id }
    } else {
      return { userId: user.id, profile: profileResult.data }
    }
  },
})

function ProfilePage() {
  const { userId, profile } = Route.useLoaderData()
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
      />
      {showSuccessMessage && <p>Profile Updated.</p>}
    </>
  )
}
