import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { useEmailRedirectTo } from '../hooks/use-email-redirect-to'
import { useAuthCommands } from '../hooks/use-auth-commands'
import type { HeadingLevel } from '@/components/ui/heading'
import {
  Form,
  FormActions,
  InputGroup,
  TextField,
  formStatusPanelCss,
} from '@/components/ui/forms'
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
  const { commands } = useAuthCommands()

  const [state, formAction, isPending] = useTypedActionState(
    resendConfirmationSchema,
    commands.resendRegisterConfirmation,
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
        <FormActions>
          <Button variant="primary" type="submit" isDisabled={isPending}>
            Send
          </Button>
        </FormActions>
      }
    >
      <Heading id={id} level={headingLevel}>
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
    <div className={css(formStatusPanelCss)}>
      <Heading level={headingLevel}>Confirmation Email Sent!</Heading>
      <p>Please check your email to confirm your account.</p>
    </div>
  )
}
