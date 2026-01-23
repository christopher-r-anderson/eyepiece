import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import z from 'zod'
import type { ComponentPropsWithoutRef } from 'react'
import {
  ResendConfirmationForm,
  ResendConfirmationSuccessMessage,
} from '@/features/auth/forms/resend-confirmation-form'
import { confirmationTypeSchema } from '@/features/auth/schemas'
import { Link } from '@/components/ui/link'
import {
  ForgotPasswordForm,
  ForgotPasswordSuccessMessage,
} from '@/features/auth/forms/forgot-password-form'
import { FormStatusSwitcher } from '@/components/ui/forms'

const ERR_CODE_OTP_EXPIRED = 'otp_expired'

export const Route = createFileRoute('/(auth)/auth/confirm-error')({
  component: ConfirmationErrorPage,
  validateSearch: z.object({
    err: z.string().optional(),
    type: confirmationTypeSchema.optional(),
  }),
})

function ConfirmationErrorPage() {
  const { err, type } = Route.useSearch()
  if (err === ERR_CODE_OTP_EXPIRED && type === 'email') {
    return <EmailOtpError />
  } else if (err === ERR_CODE_OTP_EXPIRED && type === 'recovery') {
    return <RecoveryOtpError />
  } else {
    return <UnknownError />
  }
}

export function PageHeading(props: ComponentPropsWithoutRef<'h1'>) {
  return <h1 css={{ fontSize: '1.25rem', fontWeight: 'bold' }} {...props} />
}

function RecoveryOtpError() {
  const [successfulResend, setSuccessfulResend] = useState(false)
  return (
    <>
      <PageHeading>Password Reset Link Expired</PageHeading>
      <p>
        The reset password link has expired. Please submit this form to request
        a new reset password email.
      </p>
      <FormStatusSwitcher
        showStatus={successfulResend}
        status={<ForgotPasswordSuccessMessage headingLevel={2} />}
      >
        <ForgotPasswordForm
          headingLevel={2}
          onSuccess={() => setSuccessfulResend(true)}
        />
      </FormStatusSwitcher>
    </>
  )
}

function EmailOtpError() {
  const [successfulResend, setSuccessfulResend] = useState(false)
  return (
    <>
      <PageHeading>Confirmation Link Expired</PageHeading>
      <p>
        The confirmation link has expired. Please submit this form to request a
        new confirmation email.
      </p>
      <FormStatusSwitcher
        showStatus={successfulResend}
        status={<ResendConfirmationSuccessMessage headingLevel={1} />}
      >
        <ResendConfirmationForm
          headingLevel={1}
          onSuccess={() => setSuccessfulResend(true)}
        />
      </FormStatusSwitcher>
    </>
  )
}

function UnknownError() {
  return (
    <>
      <PageHeading>Oops &hellip;</PageHeading>
      <p>
        Sorry, something went wrong. If you were trying to register or reset
        your password, these links can help:
        <ul>
          <li>
            <Link to="/register">Registration Page</Link>
          </li>
          <li>
            <Link to="/auth/forgot-password">Forgot Password Page</Link>
          </li>
        </ul>
        Or you can visit our <Link to="/">Homepage</Link>.
      </p>
    </>
  )
}
