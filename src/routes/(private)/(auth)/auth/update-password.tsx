import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { formErrorCopy } from '@/lib/form-errors'
import { UpdatePasswordForm } from '@/features/auth/forms/update-password-form'
import { FormStatusSwitcher } from '@/components/ui/forms'
import { Link } from '@/components/ui/link'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { urlToNextParam } from '@/lib/utils'
import { useOneShotFormStatus } from '@/lib/hooks/use-one-shot-form-status'

export const Route = createFileRoute('/(private)/(auth)/auth/update-password')({
  component: UpdatePasswordPage,
})

function UpdatePasswordPage() {
  const { next: nextParam, formError, status } = Route.useSearch()
  const next = nextParam ? urlToNextParam(nextParam) : undefined
  const navigate = Route.useNavigate()
  const queueToastMessage = useQueueToastMessage()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const onUpdateSuccess = useCallback(() => {
    if (next) {
      queueToastMessage({ title: 'Password updated' })
      void navigate({ to: next, replace: true })
      return
    }
    setShowSuccessMessage(true)
  }, [next, navigate, queueToastMessage])
  const seededStatus = useOneShotFormStatus(status)
  return (
    <>
      <FormStatusSwitcher
        showStatus={showSuccessMessage || seededStatus === 'updated'}
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
