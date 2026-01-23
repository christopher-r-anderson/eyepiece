import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { resetPassword } from '../auth-service'
import { useEmailRedirectTo } from '../hooks/use-email-redirect-to'
import { AuthFormHeading } from './components/auth-form-heading'
import type { HeadingLevel } from './components/auth-form-heading'
import { Form, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useActionForm, useDerivedFormState } from '@/components/ui/forms.hooks'

const forgotPasswordSchema = z.object({
  email: z.email(),
  redirectTo: z.url(),
})

export function ForgotPasswordForm({
  headingLevel,
  next,
  onSuccess,
}: {
  headingLevel: HeadingLevel
  next?: string
  onSuccess: () => void
}) {
  const [state, formAction, isPending] = useActionForm(
    forgotPasswordSchema,
    resetPassword,
  )
  const id = useId()
  const redirectTo = useEmailRedirectTo(next)
  useEffect(() => {
    if (state.status === 'success') {
      onSuccess()
    }
  }, [state, onSuccess])

  const { fieldErrors, formErrors, values } = useDerivedFormState(state)

  return (
    <Form
      aria-labelledby={id}
      aria-busy={isPending || undefined}
      autoComplete="on"
      action={formAction}
      validationErrors={fieldErrors}
      formErrors={formErrors}
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
      <AuthFormHeading id={id} headingLevel={headingLevel}>
        Reset Password
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

export function ForgotPasswordSuccessMessage({
  headingLevel,
}: {
  headingLevel: HeadingLevel
}) {
  return (
    <>
      <AuthFormHeading headingLevel={headingLevel}>
        Password reset sent!
      </AuthFormHeading>
      <p>Please check your email to reset your password.</p>
    </>
  )
}
