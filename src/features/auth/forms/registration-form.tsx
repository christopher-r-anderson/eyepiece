import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { register } from '../auth-service'
import { useEmailRedirectTo } from '../hooks/use-email-redirect-to'
import { SetPasswordField } from './components/set-password-field'
import { setPasswordFieldSchema } from './components/set-password-field.schema'
import type { FormHeadingLevel } from '@/components/ui/forms'
import { Form, FormHeading, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { displayNameSchema } from '@/lib/schemas/profile.schema'
import { useEvent } from '@/lib/hooks/use-event'

const registrationSchema = z.object({
  email: z.email(),
  displayName: displayNameSchema,
  password: setPasswordFieldSchema,
  redirectTo: z.url(),
})

export function RegistrationForm({
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
    registrationSchema,
    register,
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
            Register
          </Button>
        </div>
      }
    >
      <FormHeading id={id} headingLevel={headingLevel}>
        Register
      </FormHeading>
      <InputGroup>
        <input type="hidden" name="redirectTo" defaultValue={redirectTo} />
        <TextField
          name="displayName"
          type="text"
          autoComplete="name"
          isRequired
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
  headingLevel: FormHeadingLevel
}) {
  return (
    <>
      <FormHeading headingLevel={headingLevel}>
        Registration successful!
      </FormHeading>
      <p>Please check your email to verify your account.</p>
    </>
  )
}
