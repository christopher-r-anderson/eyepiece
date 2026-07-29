import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { UpdatePasswordForm } from '@/features/auth/forms/update-password-form'
import { useCountdown } from '@/lib/hooks/use-countdown'
import { FormStatusSwitcher } from '@/components/ui/forms'
import { Link } from '@/components/ui/link'
import { urlToNextParam } from '@/lib/utils'

export const Route = createFileRoute('/(private)/(auth)/auth/update-password')({
  component: UpdatePasswordPage,
})

function UpdatePasswordPage() {
  const { next: nextParam, formError, status } = Route.useSearch()
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
  // a native (no-JS) update redirects back with the status param; run the
  // same success flow once hydrated so the countdown still fires
  useEffect(() => {
    if (status === 'updated') {
      onUpdateSuccess()
    }
  }, [status, onUpdateSuccess])
  return (
    <>
      <FormStatusSwitcher
        showStatus={showSuccessMessage || status === 'updated'}
        status={
          next ? (
            <StatusMessage next={next} seconds={seconds} />
          ) : (
            <SuccessMessage />
          )
        }
      >
        <UpdatePasswordForm
          headingLevel={1}
          surface="panel"
          next={nextParam}
          initialFormError={formError}
          onSuccess={onUpdateSuccess}
        />
      </FormStatusSwitcher>
    </>
  )
}

function StatusMessage({ next, seconds }: { next: string; seconds: number }) {
  const isHome = next === '/'
  return (
    <p>
      Password updated successfully. Redirecting{' '}
      <Link to={next}>{isHome ? 'home' : 'back'}</Link> in {seconds}
      &hellip;
    </p>
  )
}

function SuccessMessage() {
  return (
    <p>
      Password updated successfully! Visit our <Link to="/">homepage</Link>
    </p>
  )
}
