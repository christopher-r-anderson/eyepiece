import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ForgotPasswordForm,
  ForgotPasswordSuccessMessage,
} from '@/features/auth/forms/forgot-password-form'
import { FormStatusSwitcher } from '@/components/ui/forms'
import { requireAnonymous } from '@/features/auth/guards'

export const Route = createFileRoute('/(auth)/auth/forgot-password')({
  component: ForgotPasswordPage,
  beforeLoad: requireAnonymous,
})

function ForgotPasswordPage() {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  return (
    <>
      <FormStatusSwitcher
        showStatus={showSuccessMessage}
        status={<ForgotPasswordSuccessMessage headingLevel={1} />}
      >
        <ForgotPasswordForm
          headingLevel={1}
          onSuccess={() => setShowSuccessMessage(true)}
        />
      </FormStatusSwitcher>
    </>
  )
}
