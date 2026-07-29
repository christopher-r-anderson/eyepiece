import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { formErrorCopy } from '@/components/form-errors'
import {
  ForgotPasswordForm,
  ForgotPasswordSuccessMessage,
} from '@/features/auth/forms/forgot-password-form'
import { useRedirectAuthenticatedUser } from '@/features/auth/hooks/use-redirect-authenticated-user'
import { FormStatusSwitcher } from '@/components/ui/forms'

export const Route = createFileRoute('/(public)/(auth)/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { next, formError, status } = Route.useSearch()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  useRedirectAuthenticatedUser(next)

  return (
    <>
      <FormStatusSwitcher
        showStatus={showSuccessMessage || status === 'sent'}
        status={<ForgotPasswordSuccessMessage headingLevel={1} />}
      >
        <ForgotPasswordForm
          headingLevel={1}
          next={next}
          initialFormError={formErrorCopy(formError)}
          surface="panel"
          onSuccess={() => setShowSuccessMessage(true)}
        />
      </FormStatusSwitcher>
    </>
  )
}
