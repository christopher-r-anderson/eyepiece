import { createFileRoute } from '@tanstack/react-router'
import type { Profile } from '@/domain/profile/profile.schema'
import { formErrorCopy } from '@/lib/form-errors'
import { PageHeader } from '@/components/page-header'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { UpsertProfileForm } from '@/features/profiles/forms/upsert-profile-form'
import { ensureProfile } from '@/features/profiles/profiles.queries'
import { formResultSearchParamsSchema } from '@/lib/route.schema'
import { useOneShotFormStatus } from '@/lib/hooks/use-one-shot-form-status'

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
  const queueToastMessage = useQueueToastMessage()
  useOneShotFormStatus(status, () =>
    queueToastMessage({ title: 'Profile updated' }),
  )
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
      {/* live param on purpose: the no-JS notice, replaced by the toast
          once the hook strips the param */}
      {status === 'updated' && <p role="status">Profile updated.</p>}
    </>
  )
}
