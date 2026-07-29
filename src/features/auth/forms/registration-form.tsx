import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { useEmailRedirectTo } from '../hooks/use-email-redirect-to'
import { registerFormAction } from '../auth.form-actions'
import { useAuthCommands } from '../hooks/use-auth-commands'
import { setPasswordFieldSchema } from './components/set-password-field.schema'
import { SetPasswordField } from './components/set-password-field'
import type { HeadingLevel } from '@/components/ui/heading'
import type { FormProps } from '@/components/ui/forms'
import {
  Form,
  FormActions,
  InputGroup,
  TextField,
  formStatusPanelCss,
} from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import {
  useHydratedFormSubmit,
  useTypedActionState,
} from '@/components/ui/forms.hooks'
import {
  DISPLAY_NAME_MAX_LENGTH,
  profileSchema,
} from '@/domain/profile/profile.schema'
import { useEvent } from '@/lib/hooks/use-event'
import { Heading } from '@/components/ui/heading'

const registrationSchema = z.object({
  email: z.email(),
  displayName: profileSchema.shape.displayName,
  password: setPasswordFieldSchema,
  redirectTo: z.url(),
})

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
    registrationSchema,
    commands.register,
  )
  const onHydratedSubmit = useHydratedFormSubmit(formAction)

  const onSuccessRef = useEvent(onSuccess)
  useEffect(() => {
    if (state.status === 'success') {
      onSuccessRef.current?.()
    }
  }, [state.status])

  return (
    <Form
      autoComplete="on"
      action={registerFormAction.url}
      method="post"
      onSubmit={onHydratedSubmit}
      validationErrors={state.fieldErrors}
      formError={
        state.error ?? (state.status === 'idle' ? initialFormError : undefined)
      }
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
      <Heading id={id} level={headingLevel}>
        Register
      </Heading>
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
      <Heading level={headingLevel}>Registration successful!</Heading>
      <p>Please check your email to verify your account.</p>
    </div>
  )
}
