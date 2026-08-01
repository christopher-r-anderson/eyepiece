import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { formErrorCopy } from '@/components/form-errors'
import { UpdatePasswordForm } from '@/features/auth/forms/update-password-form'
import { FormStatusSwitcher } from '@/components/ui/forms'
import { Link } from '@/components/ui/link'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { urlToNextParam } from '@/lib/utils'

export const Route = createFileRoute('/(private)/(auth)/auth/update-password')({
  component: UpdatePasswordPage,
})

function UpdatePasswordPage() {
  const { next: nextParam, formError, status } = Route.useSearch()
  const next = nextParam ? urlToNextParam(nextParam) : undefined
  const navigate = Route.useNavigate()
  const queueToastMessage = useQueueToastMessage()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  // replace, not push: the spent form must not stay reachable through Back
  const onUpdateSuccess = useCallback(() => {
    if (next) {
      queueToastMessage({ title: 'Password updated' })
      void navigate({ to: next, replace: true })
      return
    }
    setShowSuccessMessage(true)
  }, [next, navigate, queueToastMessage])
  // a native (no-JS) update without a destination redirects back with the
  // status param; seed the same success state and strip the one-shot param
  // (with next, the action redirects straight there instead)
  useEffect(() => {
    if (status !== 'updated') return
    setShowSuccessMessage(true)
    void navigate({
      search: (prev) => ({ ...prev, status: undefined, formError: undefined }),
      replace: true,
    })
  }, [status, navigate])
  return (
    <>
      <FormStatusSwitcher
        showStatus={showSuccessMessage || status === 'updated'}
        status={<SuccessMessage />}
      >
        <UpdatePasswordForm
          headingLevel={1}
          next={nextParam}
          initialFormError={formErrorCopy(formError)}
          onSuccess={onUpdateSuccess}
        />
      </FormStatusSwitcher>
    </>
  )
}

function SuccessMessage() {
  return (
    <p>
      Password updated successfully! Visit our <Link to="/">homepage</Link>
    </p>
  )
}
