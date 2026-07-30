import { useEffect } from 'react'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { useEmailRedirectTo } from '../hooks/use-email-redirect-to'
import { useAuthCommands } from '../hooks/use-auth-commands'
import { forgotPasswordFormAction } from '../auth.form-actions'
import { forgotPasswordFormSchema } from './forgot-password-form.schema'
import type { HeadingLevel } from '@/components/ui/heading'
import type { FormProps } from '@/components/ui/forms'
import { Heading } from '@/components/ui/heading'
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

export function ForgotPasswordForm({
  headingLevel,
  next,
  backHref,
  initialFormError,
  onSuccess,
  surface,
}: {
  headingLevel: HeadingLevel
  next?: string
  backHref?: string
  initialFormError?: string
  onSuccess: () => void
  surface?: FormProps['surface']
}) {
  const id = useId()
  const redirectTo = useEmailRedirectTo(next)
  const { commands } = useAuthCommands()

  const [state, formAction, isPending] = useTypedActionState(
    forgotPasswordFormSchema,
    commands.resetPassword,
    { initialError: initialFormError },
  )
  const nativeSubmit = useNativeFormSubmit(forgotPasswordFormAction, formAction)

  const onSuccessRef = useEvent(onSuccess)
  useEffect(() => {
    if (state.status === 'success') {
      onSuccessRef.current?.()
    }
  }, [state.status])

  return (
    <Form
      aria-labelledby={id}
      isPending={isPending}
      autoComplete="on"
      {...nativeSubmit}
      validationErrors={state.fieldErrors}
      formError={state.error}
      surface={surface}
      controls={
        <FormActions>
          <Button variant="primary" type="submit" isPending={isPending}>
            Reset Password
          </Button>
        </FormActions>
      }
    >
      <Heading id={id} level={headingLevel}>
        Reset Password
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

export function ForgotPasswordSuccessMessage({
  headingLevel,
}: {
  headingLevel: HeadingLevel
}) {
  return (
    <div className={css(formStatusPanelCss)}>
      <Heading level={headingLevel}>Password reset sent!</Heading>
      <p>Please check your email to reset your password.</p>
    </div>
  )
}
