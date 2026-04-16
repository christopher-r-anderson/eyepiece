import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  RegistrationForm,
  RegistrationSuccessMessage,
} from '@/features/auth/forms/registration-form'
import { Link } from '@/components/ui/link'
import { FormStatusSwitcher } from '@/components/ui/forms'
import { urlToNextParam } from '@/lib/utils'
import { requireAnonymous } from '@/lib/guards'

export const Route = createFileRoute('/(auth)/register')({
  component: RegisterPage,
  beforeLoad: requireAnonymous,
})

function RegisterPage() {
  const { next } = Route.useSearch()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
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
        <p>
          Already have an account?{' '}
          <Link
            to="/login"
            css={{ textDecoration: 'underline', marginLeft: '0.5rem' }}
          >
            Log in
          </Link>
        </p>
      </FormStatusSwitcher>
    </>
  )
}
