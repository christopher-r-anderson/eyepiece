import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { urlToNextParam } from '@/lib/utils'
import { requireAuthenticated } from '@/lib/guards'
import { redirectSearchParamsSchema } from '@/lib/route.schema'
import { useCountdown } from '@/lib/hooks/use-countdown'
import { FormStatusSwitcher } from '@/components/ui/forms'
import { UpsertProfileForm } from '@/features/profiles/forms/upsert-profile-form'
import { Link } from '@/components/ui/link'
import { getUser } from '@/features/auth/get-user'

export const Route = createFileRoute('/complete-profile')({
  component: CompleteProfilePage,
  beforeLoad: requireAuthenticated,
  validateSearch: redirectSearchParamsSchema,
  loader: async () => {
    const user = await getUser()
    if (!user) {
      throw new Error('User not found in complete-profile loader')
    }
    return { userId: user.id }
  },
})

function CompleteProfilePage() {
  const { userId } = Route.useLoaderData()
  const { next: nextParam } = Route.useSearch()
  const next = nextParam ? urlToNextParam(nextParam) : undefined
  const navigate = Route.useNavigate()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [seconds, { start }] = useCountdown(3, {
    autoStart: false,
    onComplete: () => {
      // this should be redundant since we don't count down unless next is defined
      if (next) {
        navigate({ to: next })
      }
    },
  })
  const onUpdateSuccess = useCallback(() => {
    setShowSuccessMessage(true)
    if (next) {
      start()
    }
  }, [next, start])

  return (
    <>
      <FormStatusSwitcher
        showStatus={showSuccessMessage}
        status={
          next ? (
            <SuccessRedirectMessage next={next} seconds={seconds} />
          ) : (
            <SuccessStandardMessage />
          )
        }
      >
        <UpsertProfileForm
          onSuccess={onUpdateSuccess}
          headingLevel={1}
          initialData={{ id: userId }}
        />
      </FormStatusSwitcher>
    </>
  )
}

function SuccessRedirectMessage({
  next,
  seconds,
}: {
  next: string
  seconds: number
}) {
  const isHome = next === '/'
  return (
    <>
      <h1>Profile created!</h1>
      <p>
        Redirecting <Link to={next}>{isHome ? 'home' : 'back'}</Link> in{' '}
        {seconds}
        &hellip;
      </p>
    </>
  )
}

function SuccessStandardMessage() {
  return (
    <>
      <h1>Profile created!</h1>
      <p>
        Visit our <Link to="/">homepage</Link>
      </p>
    </>
  )
}
