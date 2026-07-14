import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import type { ReactNode } from 'react'
import type { FormProps } from '@/components/ui/forms'
import type { HeadingLevel } from '@/components/ui/heading'
import { useAuthCommands } from '@/features/auth/hooks/use-auth-commands'
import {
  Form,
  InputGroup,
  TextField,
  formActionButtonCss,
} from '@/components/ui/forms'
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
} & FormProps

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
        <div
          className={grid({
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: '3',
            alignItems: 'center',
            marginBlockStart: '4',
          })}
        >
          <div className={css({ minWidth: 0 })}>{forgotPasswordLink}</div>
          <Button
            variant="primary"
            type="submit"
            isDisabled={isPending}
            css={formActionButtonCss}
          >
            Log In
          </Button>
        </div>
      }
    >
      <Heading id={id} headingLevel={headingLevel}>
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
