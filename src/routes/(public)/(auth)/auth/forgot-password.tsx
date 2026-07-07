import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ForgotPasswordForm,
  ForgotPasswordSuccessMessage,
} from '@/features/auth/forms/forgot-password-form'
import { AuthPageSessionCheck } from '@/features/auth/components/auth-page-session-check'
import { useRedirectAuthenticatedUser } from '@/features/auth/hooks/use-redirect-authenticated-user'
import { FormStatusSwitcher } from '@/components/ui/forms'

export const Route = createFileRoute('/(public)/(auth)/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { next } = Route.useSearch()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const { shouldShowAuthForm } = useRedirectAuthenticatedUser(next)

  if (!shouldShowAuthForm) {
    return <AuthPageSessionCheck heading="Reset Password" />
  }

  return (
    <>
      <FormStatusSwitcher
        showStatus={showSuccessMessage}
        status={<ForgotPasswordSuccessMessage headingLevel={1} />}
      >
        <ForgotPasswordForm
          headingLevel={1}
          next={next}
          surface="panel"
          onSuccess={() => setShowSuccessMessage(true)}
        />
      </FormStatusSwitcher>
    </>
  )
}
