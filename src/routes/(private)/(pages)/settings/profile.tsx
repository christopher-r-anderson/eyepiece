import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import type { Profile } from '@/domain/profile/profile.schema'
import { formErrorCopy } from '@/components/form-errors'
import { PageHeader } from '@/components/page-header'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { UpsertProfileForm } from '@/features/profiles/forms/upsert-profile-form'
import { ensureProfile } from '@/features/profiles/profiles.queries'
import { formResultSearchParamsSchema } from '@/lib/route.schema'

type MaybeProfile = Partial<Profile> & Pick<Profile, 'id'>

type ProfilePageData = {
  maybeProfile: MaybeProfile
}

export const Route = createFileRoute('/(private)/(pages)/settings/profile')({
  component: ProfilePage,
  // one-shot params from the native (no-JS) form post's redirect back
  validateSearch: formResultSearchParamsSchema,
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
  const queueToastMessage = useQueueToastMessage()
  // the native (no-JS) redirect's status is one-shot: the SSR'd notice
  // below is the no-JS feedback; once hydrated, hand it to a toast and
  // strip the param
  useEffect(() => {
    if (status !== 'updated') return
    queueToastMessage({ title: 'Profile updated' })
    void navigate({
      search: (prev) => ({ ...prev, status: undefined, formError: undefined }),
      replace: true,
    })
  }, [status, navigate, queueToastMessage])
  return (
    <>
      <PageHeader title="Settings" />
      <UpsertProfileForm
        actionType="update"
        initialData={maybeProfile}
        initialFormError={formErrorCopy(formError)}
        onSuccess={() => queueToastMessage({ title: 'Profile updated' })}
        headingLevel={2}
      />
      {status === 'updated' && <p role="status">Profile updated.</p>}
    </>
  )
}
