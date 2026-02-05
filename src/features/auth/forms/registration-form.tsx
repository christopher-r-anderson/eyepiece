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
import { useActionForm, useDerivedFormState } from '@/components/ui/forms.hooks'

const registrationSchema = z.object({
  email: z.email(),
  familyName: z.string().trim().min(1),
  givenName: z.string().trim().min(1),
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
  const [state, formAction, isPending] = useActionForm(
    registrationSchema,
    register,
  )
  const redirectTo = useEmailRedirectTo(next)
  useEffect(() => {
    if (state.status === 'success') {
      onSuccess()
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
          name="givenName"
          type="text"
          autoComplete="given-name"
          isRequired
          defaultValue={values.givenName}
          label="First Name"
        />
        <TextField
          name="familyName"
          type="text"
          autoComplete="family-name"
          isRequired
          defaultValue={values.familyName}
          label="Last Name"
        />
        <TextField
          name="email"
          type="email"
          autoComplete="email"
          isRequired
          defaultValue={values.email}
          label="Email"
          placeholder="name@example.com"
        />
        <SetPasswordField defaultValue={values.password} />
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
