import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { login } from '../auth-service'
import type { ReactNode } from 'react'
import type { FormHeadingLevel, FormProps } from '@/components/ui/forms'
import { Form, FormHeading, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useActionForm, useDerivedFormState } from '@/components/ui/forms.hooks'

const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
})

type LoginProps = {
  headingLevel: FormHeadingLevel
  onSuccess: () => void
  forgotPasswordLink: ReactNode
} & FormProps

export function LoginForm({
  headingLevel,
  onSuccess,
  forgotPasswordLink,
}: LoginProps) {
  const id = useId()
  const [state, formAction, isPending] = useActionForm(loginSchema, login)

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
            alignItems: 'center',
            marginBlockStart: '1rem',
          }}
        >
          <div css={{ marginInlineEnd: 'auto' }}>{forgotPasswordLink}</div>
          <Button variant="primary" type="submit" isDisabled={isPending}>
            Log In
          </Button>
        </div>
      }
    >
      <FormHeading id={id} headingLevel={headingLevel}>
        Log In
      </FormHeading>
      <InputGroup>
        <TextField
          name="email"
          type="email"
          autoComplete="username"
          isRequired
          defaultValue={values.email}
          label="Email"
          placeholder="name@example.com"
        />
        <TextField
          name="password"
          type="password"
          autoComplete="current-password"
          isRequired
          defaultValue={values.password}
          label="Password"
        />
      </InputGroup>
    </Form>
  )
}
