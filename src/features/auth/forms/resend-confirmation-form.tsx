import { useEffect } from 'react'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { useEmailRedirectTo } from '../hooks/use-email-redirect-to'
import { useAuthCommands } from '../hooks/use-auth-commands'
import { resendConfirmationFormAction } from '../auth.form-actions'
import { resendConfirmationFormSchema } from './resend-confirmation-form.schema'
import type { HeadingLevel } from '@/components/ui/heading'
import {
  Form,
  FormActions,
  InputGroup,
  TextField,
  formStatusPanelCss,
} from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import {
  useNativeFormSubmit,
  useTypedActionState,
} from '@/components/ui/forms.hooks'
import { useEvent } from '@/lib/hooks/use-event'
import { Heading } from '@/components/ui/heading'

export function ResendConfirmationForm({
  headingLevel,
  next,
  backHref,
  initialFormError,
  onSuccess,
}: {
  headingLevel: HeadingLevel
  next?: string
  backHref?: string
  initialFormError?: string
  onSuccess?: () => void
}) {
  const id = useId()
  const redirectTo = useEmailRedirectTo(next)
  const { commands } = useAuthCommands()

  const [state, formAction, isPending] = useTypedActionState(
    resendConfirmationFormSchema,
    commands.resendRegisterConfirmation,
    { initialError: initialFormError },
  )
  const nativeSubmit = useNativeFormSubmit(
    resendConfirmationFormAction,
    formAction,
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
      {...nativeSubmit}
      validationErrors={state.fieldErrors}
      formError={state.error}
      aria-labelledby={id}
      isPending={isPending}
      controls={
        <FormActions>
          <Button variant="primary" type="submit" isPending={isPending}>
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
        {next && <input type="hidden" name="next" defaultValue={next} />}
        {backHref && (
          <input type="hidden" name="back" defaultValue={backHref} />
        )}
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
