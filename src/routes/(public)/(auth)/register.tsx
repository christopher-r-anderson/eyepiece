import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { css } from 'styled-system/css'
import {
  RegistrationForm,
  RegistrationSuccessMessage,
} from '@/features/auth/forms/registration-form'
import { AuthPageSessionCheck } from '@/features/auth/components/auth-page-session-check'
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
        <p
          className={css({
            marginTop: '4',
            marginInline: '0',
            marginBottom: '0',
            lineHeight: 'base',
          })}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            css={css.raw({ textDecoration: 'underline', marginLeft: '2' })}
          >
            Log in
          </Link>
        </p>
      </FormStatusSwitcher>
    </>
  )
}
