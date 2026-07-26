import { useEffect } from 'react'
import { z } from 'zod'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { useCurrentUserQuery } from '../auth.queries'
import { useAuthCommands } from '../hooks/use-auth-commands'
import { setPasswordFieldSchema } from './components/set-password-field.schema'
import { SetPasswordField } from './components/set-password-field'
import type { HeadingLevel } from '@/components/ui/heading'
import type { FormProps } from '@/components/ui/forms'
import { Form, FormActions, InputGroup } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { useEvent } from '@/lib/hooks/use-event'
import { Heading } from '@/components/ui/heading'

const updatePasswordSchema = z.object({
  password: setPasswordFieldSchema,
})

export function UpdatePasswordForm({
  headingLevel,
  onSuccess,
  surface,
}: {
  headingLevel: HeadingLevel
  onSuccess: () => void
  surface?: FormProps['surface']
}) {
  const id = useId()
  const userQuery = useCurrentUserQuery()
  const { commands } = useAuthCommands()

  const [state, formAction, isPending] = useTypedActionState(
    updatePasswordSchema,
    commands.updatePassword,
  )

  const onSuccessRef = useEvent(onSuccess)
  useEffect(() => {
    if (state.status === 'success') {
      onSuccessRef.current?.()
    }
  }, [state.status])

  return (
    <Form
      aria-labelledby={id}
      autoComplete="on"
      action={formAction}
      validationErrors={state.fieldErrors}
      formError={state.error}
      surface={surface}
      isPending={isPending}
      controls={
        <FormActions>
          <Button variant="primary" type="submit" isPending={isPending}>
            Update
          </Button>
        </FormActions>
      }
    >
      <Heading id={id} level={headingLevel}>
        Update Password
      </Heading>
      <InputGroup>
        {/* for the browser save password prompt */}
        <input
          type="email"
          name="username"
          value={userQuery.data?.email ?? ''}
          autoComplete="username"
          className={css({ display: 'none' })}
          readOnly
        />
        <SetPasswordField defaultValue={state.formData?.password} />
      </InputGroup>
    </Form>
  )
}
