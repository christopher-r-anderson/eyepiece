import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { urlToNextParam } from '@/lib/utils'
import { requireAuthenticated } from '@/lib/guards'
import { redirectSearchParamsSchema } from '@/lib/route.schema'
import { useCountdown } from '@/lib/hooks/use-countdown'
import { FormStatusSwitcher, formStatusPanelCss } from '@/components/ui/forms'
import { UpsertProfileForm } from '@/features/profiles/forms/upsert-profile-form'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/complete-profile')({
  component: CompleteProfilePage,
  beforeLoad: requireAuthenticated,
  validateSearch: redirectSearchParamsSchema,
})

function CompleteProfilePage() {
  const { user } = Route.useRouteContext()
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
          actionType="create"
          onSuccess={onUpdateSuccess}
          headingLevel={1}
          surface="panel"
          initialData={{ id: user.id }}
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
    <section css={formStatusPanelCss}>
      <h1>Profile created!</h1>
      <p>
        Redirecting <Link to={next}>{isHome ? 'home' : 'back'}</Link> in{' '}
        {seconds}
        &hellip;
      </p>
    </section>
  )
}

function SuccessStandardMessage() {
  return (
    <section css={formStatusPanelCss}>
      <h1>Profile created!</h1>
      <p>
        Visit our <Link to="/">homepage</Link>
      </p>
    </section>
  )
}
