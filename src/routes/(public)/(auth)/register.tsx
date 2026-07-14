import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  RegistrationForm,
  RegistrationSuccessMessage,
} from '@/features/auth/forms/registration-form'
import { AuthPageSessionCheck } from '@/features/auth/components/auth-page-session-check'
import {
  AuthAltAction,
  authAltActionLinkCss,
} from '@/features/auth/components/auth-alt-action'
import { useRedirectAuthenticatedUser } from '@/features/auth/hooks/use-redirect-authenticated-user'
import { Link } from '@/components/ui/link'
import { FormStatusSwitcher } from '@/components/ui/forms'
import { urlToNextParam } from '@/lib/utils'

export const Route = createFileRoute('/(public)/(auth)/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { next } = Route.useSearch()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const { shouldShowAuthForm } = useRedirectAuthenticatedUser(next)

  if (!shouldShowAuthForm) {
    return <AuthPageSessionCheck heading="Register" />
  }

  return (
    <>
      <FormStatusSwitcher
        showStatus={showSuccessMessage}
        status={<RegistrationSuccessMessage headingLevel={1} />}
      >
        <RegistrationForm
          headingLevel={1}
          surface="panel"
          onSuccess={() => setShowSuccessMessage(true)}
          next={next ? urlToNextParam(next) : undefined}
        />
        <AuthAltAction>
          Already have an account?{' '}
          <Link to="/login" css={authAltActionLinkCss}>
            Log in
          </Link>
        </AuthAltAction>
      </FormStatusSwitcher>
    </>
  )
}
