import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { resendRegisterConfirmation } from '../auth-service'
import { useEmailRedirectTo } from '../hooks/use-email-redirect-to'
import { AuthFormHeading } from './components/auth-form-heading'
import type { HeadingLevel } from './components/auth-form-heading'
import { Form, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useActionForm, useDerivedFormState } from '@/components/ui/forms.hooks'

const resendConfirmationSchema = z.object({
  email: z.email(),
  redirectTo: z.url(),
})

export function ResendConfirmationForm({
  headingLevel,
  next,
  onSuccess,
}: {
  headingLevel: HeadingLevel
  next?: string
  onSuccess?: () => void
}) {
  const id = useId()
  const [state, formAction, isPending] = useActionForm(
    resendConfirmationSchema,
    resendRegisterConfirmation,
  )
  const redirectTo = useEmailRedirectTo(next)

  useEffect(() => {
    if (state.status === 'success') {
      onSuccess?.()
    }
  }, [state, onSuccess])

  const { fieldErrors, formErrors, values } = useDerivedFormState(state)

  return (
    <Form
      autoComplete="on"
      action={formAction}
      validationErrors={fieldErrors}
      formErrors={formErrors}
      aria-labelledby={id}
      aria-busy={isPending || undefined}
      controls={
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBlockStart: '1rem',
          }}
        >
          <Button variant="primary" type="submit" isDisabled={isPending}>
            Send
          </Button>
        </div>
      }
    >
      <AuthFormHeading id={id} headingLevel={headingLevel}>
        Resend Confirmation Email
      </AuthFormHeading>
      <InputGroup>
        <input type="hidden" name="redirectTo" defaultValue={redirectTo} />
        <TextField
          name="email"
          type="email"
          autoComplete="email"
          isRequired
          defaultValue={values.email}
          label="Email"
          placeholder="name@example.com"
        />
      </InputGroup>
    </Form>
  )
}

export function ResendConfirmationSuccessMessage({
  headingLevel,
}: {
  headingLevel: HeadingLevel
}) {
  return (
    <>
      <AuthFormHeading headingLevel={headingLevel}>
        Confirmation Email Sent!
      </AuthFormHeading>
      <p>Please check your email to confirm your account.</p>
    </>
  )
}
