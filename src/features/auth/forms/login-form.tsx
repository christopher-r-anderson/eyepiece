import { useEffect } from 'react'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { useAuthCommands } from '../hooks/use-auth-commands'
import { loginFormAction } from '../auth.form-actions'
import { loginFormSchema } from './login-form.schema'
import { authFormHeadingCss } from './form-heading.styles'
import type { ReactNode } from 'react'
import type { FormProps } from '@/components/ui/forms'
import type { HeadingLevel } from '@/components/ui/heading'
import { Form, FormActions, InputGroup, TextField } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import {
  useNativeFormSubmit,
  useTypedActionState,
} from '@/components/ui/forms.hooks'
import { useEvent } from '@/lib/hooks/use-event'
import { Heading } from '@/components/ui/heading'

type LoginProps = {
  headingLevel: HeadingLevel
  next?: string
  initialFormError?: string
  onSuccess: () => void
  forgotPasswordLink: ReactNode
} & Pick<FormProps, 'surface'>

export function LoginForm({
  headingLevel,
  next,
  initialFormError,
  onSuccess,
  forgotPasswordLink,
  surface,
}: LoginProps) {
  const id = useId()
  const { commands } = useAuthCommands()

  const [state, formAction, isPending] = useTypedActionState(
    loginFormSchema,
    commands.login,
    { initialError: initialFormError },
  )
  const nativeSubmit = useNativeFormSubmit(loginFormAction, formAction)

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
          <div className={css({ minWidth: 0 })}>{forgotPasswordLink}</div>
          <Button variant="primary" type="submit" isPending={isPending}>
            Log In
          </Button>
        </FormActions>
      }
    >
      <Heading
        id={id}
        level={headingLevel}
        css={authFormHeadingCss(headingLevel)}
      >
        Log In
      </Heading>
      <InputGroup>
        {next && <input type="hidden" name="next" defaultValue={next} />}
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
