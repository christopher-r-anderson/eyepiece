import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { resendRegisterConfirmation } from '../auth-service'
import { useEmailRedirectTo } from '../hooks/use-email-redirect-to'
import type { FormHeadingLevel } from '@/components/ui/forms'
import { Form, FormHeading, InputGroup, TextField } from '@/components/ui/forms'
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
  headingLevel: FormHeadingLevel
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

  const { fieldErrors, formError, values } = useDerivedFormState(state)

  return (
    <Form
      autoComplete="on"
      action={formAction}
      validationErrors={fieldErrors}
      formError={formError}
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
      <FormHeading id={id} headingLevel={headingLevel}>
        Resend Confirmation Email
      </FormHeading>
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
  headingLevel: FormHeadingLevel
}) {
  return (
    <>
      <FormHeading headingLevel={headingLevel}>
        Confirmation Email Sent!
      </FormHeading>
      <p>Please check your email to confirm your account.</p>
    </>
  )
}
