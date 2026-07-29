import { createFileRoute, useLocation } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { formErrorCopy } from '@/components/form-errors'
import { PageHeading } from '@/components/page-heading'
import {
  ResendConfirmationForm,
  ResendConfirmationSuccessMessage,
} from '@/features/auth/forms/resend-confirmation-form'
import { confirmationTypeSchema } from '@/features/auth/auth.schema'
import { Link } from '@/components/ui/link'
import { urlToNextParam } from '@/lib/utils'
import {
  ForgotPasswordForm,
  ForgotPasswordSuccessMessage,
} from '@/features/auth/forms/forgot-password-form'
import { FormStatusSwitcher } from '@/components/ui/forms'

const ERR_CODE_OTP_EXPIRED = 'otp_expired'

export const Route = createFileRoute('/(public)/(auth)/auth/confirm-error')({
  component: ConfirmationErrorPage,
  headers: () => ({
    'Netlify-Vary': 'query=err|type|next|formError|status',
  }),
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

function RecoveryOtpError() {
  const { formError, status, next } = Route.useSearch()
  // native posts return here rather than the form's home page; strip the
  // one-shot params so a stale error never rides along
  const backHref = urlToNextParam(useLocation({ select: (l) => l.href }))
  const [successfulResend, setSuccessfulResend] = useState(false)
  return (
    <>
      <PageHeading>Password Reset Link Expired</PageHeading>
      <p>
        The reset password link has expired. Please submit this form to request
        a new reset password email.
      </p>
      <FormStatusSwitcher
        showStatus={successfulResend || status === 'sent'}
        status={<ForgotPasswordSuccessMessage headingLevel={2} />}
      >
        <ForgotPasswordForm
          headingLevel={2}
          next={next}
          backHref={backHref}
          initialFormError={formErrorCopy(formError)}
          onSuccess={() => setSuccessfulResend(true)}
        />
      </FormStatusSwitcher>
    </>
  )
}

function EmailOtpError() {
  const { formError, status, next } = Route.useSearch()
  const backHref = urlToNextParam(useLocation({ select: (l) => l.href }))
  const [successfulResend, setSuccessfulResend] = useState(false)
  return (
    <>
      <PageHeading>Confirmation Link Expired</PageHeading>
      <p>
        The confirmation link has expired. Please submit this form to request a
        new confirmation email.
      </p>
      <FormStatusSwitcher
        showStatus={successfulResend || status === 'sent'}
        status={<ResendConfirmationSuccessMessage headingLevel={2} />}
      >
        <ResendConfirmationForm
          headingLevel={2}
          next={next}
          backHref={backHref}
          initialFormError={formErrorCopy(formError)}
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
      </p>
      <ul>
        <li>
          <Link to="/register">Registration Page</Link>
        </li>
        <li>
          <Link to="/auth/forgot-password">Forgot Password Page</Link>
        </li>
      </ul>
      <p>
        Or you can visit our <Link to="/">Homepage</Link>.
      </p>
    </>
  )
}
