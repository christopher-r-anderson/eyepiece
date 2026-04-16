import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { setPasswordFieldSchema } from './components/set-password-field.schema'
import type { HeadingLevel } from '@/components/ui/heading'
import { useEmailRedirectTo } from '@/features/auth/hooks/use-email-redirect-to'
import { useAuth } from '@/features/auth/auth.provider'
import { SetPasswordField } from '@/features/auth/forms/components/set-password-field'
import { Form, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { profileSchema } from '@/domain/profile/profile.schema'
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
  onSuccess,
  surface,
}: {
  headingLevel: HeadingLevel
  next?: string
  onSuccess: () => void
  surface?: 'plain' | 'panel'
}) {
  const id = useId()
  const redirectTo = useEmailRedirectTo(next)
  const { commands } = useAuth()

  const [state, formAction, isPending] = useTypedActionState(
    registrationSchema,
    commands.register,
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
      surface={surface}
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
      <Heading id={id} headingLevel={headingLevel}>
        Register
      </Heading>
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
  headingLevel: HeadingLevel
}) {
  return (
    <>
      <Heading headingLevel={headingLevel}>Registration successful!</Heading>
      <p>Please check your email to verify your account.</p>
    </>
  )
}
