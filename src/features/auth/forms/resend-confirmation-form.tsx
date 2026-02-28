import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { resendRegisterConfirmation } from '../auth-service'
import { useEmailRedirectTo } from '../hooks/use-email-redirect-to'
import type { HeadingLevel } from '@/components/ui/heading'
import { Form, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { useEvent } from '@/lib/hooks/use-event'
import { Heading } from '@/components/ui/heading'

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
  const redirectTo = useEmailRedirectTo(next)

  const [state, formAction, isPending] = useTypedActionState(
    resendConfirmationSchema,
    resendRegisterConfirmation,
  )

  const onSuccessRef = useEvent(onSuccess)
  useEffect(() => {
    if (state.status === 'success') {
      onSuccessRef.current?.()
    }
  }, [state.status])

  return (
    <Form
      autoComplete="on"
      action={formAction}
      validationErrors={state.fieldErrors}
      formError={state.error}
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
      <Heading id={id} headingLevel={headingLevel}>
        Resend Confirmation Email
      </Heading>
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

export function ResendConfirmationSuccessMessage({
  headingLevel,
}: {
  headingLevel: HeadingLevel
}) {
  return (
    <>
      <Heading headingLevel={headingLevel}>Confirmation Email Sent!</Heading>
      <p>Please check your email to confirm your account.</p>
    </>
  )
}
