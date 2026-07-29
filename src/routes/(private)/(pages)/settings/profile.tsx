import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import type { Profile } from '@/domain/profile/profile.schema'
import { UpsertProfileForm } from '@/features/profiles/forms/upsert-profile-form'
import { ensureProfile } from '@/features/profiles/profiles.queries'

type MaybeProfile = Partial<Profile> & Pick<Profile, 'id'>

type ProfilePageData = {
  maybeProfile: MaybeProfile
}

export const Route = createFileRoute('/(private)/(pages)/settings/profile')({
  component: ProfilePage,
  // one-shot params from the native (no-JS) form post's redirect back
  validateSearch: z.object({
    formError: z.string().max(300).optional(),
    status: z.enum(['updated']).optional(),
  }),
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
  const { formError, status } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  // the native (no-JS) redirect's status is one-shot: seed the same local
  // message and strip the param so it expires like the hydrated one
  useEffect(() => {
    if (status !== 'updated') return
    setShowSuccessMessage(true)
    void navigate({
      search: (prev) => ({ ...prev, status: undefined, formError: undefined }),
      replace: true,
    })
  }, [status, navigate])
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
        initialFormError={formError}
        onSuccess={() => setShowSuccessMessage(true)}
        headingLevel={1}
      />
      {(showSuccessMessage || status === 'updated') && <p>Profile Updated.</p>}
    </>
  )
}
