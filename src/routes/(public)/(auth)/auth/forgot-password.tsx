import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { formErrorCopy } from '@/lib/form-errors'
import {
  ForgotPasswordForm,
  ForgotPasswordSuccessMessage,
} from '@/features/auth/forms/forgot-password-form'
import { useRedirectAuthenticatedUser } from '@/features/auth/hooks/use-redirect-authenticated-user'
import { FormStatusSwitcher } from '@/components/ui/forms'
import { useOneShotFormStatus } from '@/lib/hooks/use-one-shot-form-status'

export const Route = createFileRoute('/(public)/(auth)/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { next, formError, status } = Route.useSearch()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const seededStatus = useOneShotFormStatus(status)
  useRedirectAuthenticatedUser(next)

  return (
    <>
      <FormStatusSwitcher
        showStatus={showSuccessMessage || seededStatus === 'sent'}
        status={<ForgotPasswordSuccessMessage headingLevel={1} />}
      >
        <ForgotPasswordForm
          headingLevel={1}
          next={next}
          initialFormError={formErrorCopy(formError)}
          onSuccess={() => setShowSuccessMessage(true)}
        />
      </FormStatusSwitcher>
    </>
  )
}
