import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { useAuthCommands } from '../hooks/use-auth-commands'
import type { ReactNode } from 'react'
import type { FormProps } from '@/components/ui/forms'
import type { HeadingLevel } from '@/components/ui/heading'
import { Form, FormActions, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { useEvent } from '@/lib/hooks/use-event'
import { Heading } from '@/components/ui/heading'

const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
})

type LoginProps = {
  headingLevel: HeadingLevel
  onSuccess: () => void
  forgotPasswordLink: ReactNode
} & Pick<FormProps, 'surface'>

export function LoginForm({
  headingLevel,
  onSuccess,
  forgotPasswordLink,
  surface,
}: LoginProps) {
  const id = useId()
  const { commands } = useAuthCommands()

  const [state, formAction, isPending] = useTypedActionState(
    loginSchema,
    commands.login,
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
        <FormActions>
          <div className={css({ minWidth: 0 })}>{forgotPasswordLink}</div>
          <Button variant="primary" type="submit" isDisabled={isPending}>
            Log In
          </Button>
        </FormActions>
      }
    >
      <Heading id={id} level={headingLevel}>
        Log In
      </Heading>
      <InputGroup>
        <TextField
          name="email"
          type="email"
          autoComplete="username"
          isRequired
          defaultValue={state.formData?.email}
          label="Email"
          placeholder="name@example.com"
        />
        <TextField
          name="password"
          type="password"
          autoComplete="current-password"
          isRequired
          defaultValue={state.formData?.password}
          label="Password"
        />
      </InputGroup>
    </Form>
  )
}
