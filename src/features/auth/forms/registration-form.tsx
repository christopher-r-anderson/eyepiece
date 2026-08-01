import { useEffect } from 'react'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { useEmailRedirectTo } from '../hooks/use-email-redirect-to'
import { registerFormAction } from '../auth.form-actions'
import { useAuthCommands } from '../hooks/use-auth-commands'
import { registrationFormSchema } from './registration-form.schema'
import { SetPasswordField } from './components/set-password-field'
import type { HeadingLevel } from '@/components/ui/heading'
import type { FormProps } from '@/components/ui/forms'
import {
  Form,
  FormActions,
  FormHeading,
  InputGroup,
  TextField,
  formStatusPanelCss,
} from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import {
  useNativeFormSubmit,
  useTypedActionState,
} from '@/components/ui/forms.hooks'
import { DISPLAY_NAME_MAX_LENGTH } from '@/domain/profile/profile.schema'
import { useEvent } from '@/lib/hooks/use-event'

export function RegistrationForm({
  headingLevel,
  next,
  initialFormError,
  onSuccess,
  surface,
}: {
  headingLevel: HeadingLevel
  next?: string
  initialFormError?: string
  onSuccess: () => void
  surface?: FormProps['surface']
}) {
  const id = useId()
  const redirectTo = useEmailRedirectTo(next)
  const { commands } = useAuthCommands()

  const [state, formAction, isPending] = useTypedActionState(
    registrationFormSchema,
    commands.register,
    { initialError: initialFormError },
  )
  const nativeSubmit = useNativeFormSubmit(registerFormAction, formAction)

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
      surface={surface}
      aria-labelledby={id}
      isPending={isPending}
      controls={
        <FormActions>
          <Button variant="primary" type="submit" isPending={isPending}>
            Register
          </Button>
        </FormActions>
      }
    >
      <FormHeading id={id} level={headingLevel}>
        Register
      </FormHeading>
      <InputGroup>
        <input type="hidden" name="redirectTo" defaultValue={redirectTo} />
        {next && <input type="hidden" name="next" defaultValue={next} />}
        <TextField
          name="displayName"
          type="text"
          autoComplete="name"
          isRequired
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          pattern=".*\S.*"
          defaultValue={state.formData?.displayName}
          label="Display Name (shown publicly)"
        />
        <TextField
          name="email"
          type="email"
          autoComplete="email"
          isRequired
          defaultValue={state.formData?.email}
          label="Email"
          placeholder="name@example.com"
        />
        <SetPasswordField defaultValue={state.formData?.password} />
      </InputGroup>
    </Form>
  )
}

export function RegistrationSuccessMessage({
  headingLevel,
}: {
  headingLevel: HeadingLevel
}) {
  return (
    <div className={css(formStatusPanelCss)}>
      <FormHeading level={headingLevel}>Registration successful!</FormHeading>
      <p>Please check your email to verify your account.</p>
    </div>
  )
}
