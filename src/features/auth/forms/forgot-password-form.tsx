import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { resetPassword } from '../auth-service'
import { useEmailRedirectTo } from '../hooks/use-email-redirect-to'
import type { FormHeadingLevel } from '@/components/ui/forms'
import { Form, FormHeading, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { useEvent } from '@/lib/hooks/use-event'

const forgotPasswordSchema = z.object({
  email: z.email(),
  redirectTo: z.url(),
})

export function ForgotPasswordForm({
  headingLevel,
  next,
  onSuccess,
}: {
  headingLevel: FormHeadingLevel
  next?: string
  onSuccess: () => void
}) {
  const id = useId()
  const redirectTo = useEmailRedirectTo(next)

  const [state, formAction, isPending] = useTypedActionState(
    forgotPasswordSchema,
    resetPassword,
  )

  const onSuccessRef = useEvent(onSuccess)
  useEffect(() => {
    if (state.status === 'success') {
      onSuccessRef.current?.()
    }
  }, [state.status])

  return (
    <Form
      aria-labelledby={id}
      aria-busy={isPending || undefined}
      autoComplete="on"
      action={formAction}
      validationErrors={state.fieldErrors}
      formError={state.error}
      controls={
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBlockStart: '1rem',
          }}
        >
          <Button variant="primary" type="submit" isDisabled={isPending}>
            Reset Password
          </Button>
        </div>
      }
    >
      <FormHeading id={id} headingLevel={headingLevel}>
        Reset Password
      </FormHeading>
      <InputGroup>
        <input type="hidden" name="redirectTo" defaultValue={redirectTo} />
        <TextField
          name="email"
          type="email"
          autoComplete="email"
          isRequired
          defaultValue={state.formData?.email}
          label="Email"
          placeholder="name@example.com"
        />
      </InputGroup>
    </Form>
  )
}

export function ForgotPasswordSuccessMessage({
  headingLevel,
}: {
  headingLevel: FormHeadingLevel
}) {
  return (
    <>
      <FormHeading headingLevel={headingLevel}>
        Password reset sent!
      </FormHeading>
      <p>Please check your email to reset your password.</p>
    </>
  )
}
