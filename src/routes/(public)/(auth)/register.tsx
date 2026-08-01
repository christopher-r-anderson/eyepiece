import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { formErrorCopy } from '@/components/form-errors'
import {
  RegistrationForm,
  RegistrationSuccessMessage,
} from '@/features/auth/forms/registration-form'
import { AuthAltAction } from '@/features/auth/components/auth-alt-action'
import { useRedirectAuthenticatedUser } from '@/features/auth/hooks/use-redirect-authenticated-user'
import { Link } from '@/components/ui/link'
import { FormStatusSwitcher } from '@/components/ui/forms'
import { urlToNextParam } from '@/lib/utils'

export const Route = createFileRoute('/(public)/(auth)/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { next, formError, status } = Route.useSearch()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  useRedirectAuthenticatedUser(next)

  return (
    <>
      <FormStatusSwitcher
        showStatus={showSuccessMessage || status === 'sent'}
        status={<RegistrationSuccessMessage headingLevel={1} />}
      >
        <RegistrationForm
          headingLevel={1}
          initialFormError={formErrorCopy(formError)}
          onSuccess={() => setShowSuccessMessage(true)}
          next={next ? urlToNextParam(next) : undefined}
        />
        <AuthAltAction>
          Already have an account?{' '}
          <Link to="/login" variant="underline">
            Log in
          </Link>
        </AuthAltAction>
      </FormStatusSwitcher>
    </>
  )
}
